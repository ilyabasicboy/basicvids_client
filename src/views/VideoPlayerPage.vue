<template>
  <section class="video-player-page">
    <article class="panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Player</p>
          <h2>{{ videoTitle }}</h2>
        </div>
        <div class="form-actions">
          <button v-if="canEdit" class="danger-button" type="button" @click="pendingDeleteVideo = video">
            Delete video
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state">Loading video...</div>
      <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
      <div v-else-if="video?.status === 'ready'" class="video-player-area">
        <video class="video-player" :src="currentVideoUrl" controls preload="metadata">
          Your browser cannot play this video.
        </video>
        <label v-if="qualityOptions.length > 1" class="quality-select">
          <span>Quality</span>
          <select v-model="selectedQuality">
            <option v-for="quality in qualityOptions" :key="quality.value" :value="quality.value">
              {{ quality.label }}
            </option>
          </select>
        </label>
      </div>
      <div v-else-if="video?.status === 'processing'" class="empty-state">Video is still processing.</div>
      <div v-else-if="video?.status === 'failed'" class="empty-state">
        {{ video.processing_error || 'Video processing failed.' }}
      </div>
      <div v-else class="empty-state">Video not found.</div>

      <form v-if="video" class="detail-form" @submit.prevent="submit">
        <dl class="detail-list">
          <div>
            <dt>Title</dt>
            <dd v-if="!isEditing">{{ video.title || 'Untitled video' }}</dd>
            <dd v-else>
              <input v-model.trim="form.title" type="text" required />
            </dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd v-if="!isEditing">{{ video.description || 'No description.' }}</dd>
            <dd v-else>
              <textarea v-model.trim="form.description" rows="5"></textarea>
            </dd>
          </div>
          <div>
            <dt>Author</dt>
            <dd class="user-name-line">
              <UserAvatar :user-id="video.author_id" :label="authorLabel" :avatar-url="avatarUrl" />
              <span>{{ authorLabel }}</span>
            </dd>
          </div>
        </dl>

        <div v-if="canEdit" class="form-actions">
          <button v-if="!isEditing" class="primary-button" type="button" @click="startEditing">
            Change
          </button>
          <template v-else>
            <button class="primary-button" type="submit" :disabled="isChangingVideo">
              {{ isChangingVideo ? 'Saving...' : 'Save changes' }}
            </button>
            <button class="ghost-button" type="button" :disabled="isChangingVideo" @click="cancelEditing">
              Cancel
            </button>
          </template>
        </div>
      </form>

      <Transition name="modal">
        <div v-if="pendingDeleteVideo" class="modal-backdrop" role="presentation" @click.self="closeDeleteModal">
          <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-player-video-title">
            <div class="panel-heading">
              <p class="eyebrow">Confirm</p>
              <h2 id="delete-player-video-title">Delete video</h2>
            </div>
            <p class="modal-copy">
              Delete "{{ pendingDeleteVideo.title || pendingDeleteVideo.original_filename }}"?
            </p>
            <div class="form-actions">
              <button class="danger-button" type="button" @click="confirmDeleteVideo">
                Delete video
              </button>
              <button class="ghost-button" type="button" @click="closeDeleteModal">
                Cancel
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </article>

    <article v-if="video" class="panel comments-panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Comments</p>
          <h2>{{ comments.length }} comments</h2>
        </div>
        <button type="button" class="ghost-button" @click="loadCurrentComments">Refresh</button>
      </div>

      <form v-if="isAuthenticated" class="comment-form" @submit.prevent="submitComment">
        <label>
          <span>Comment</span>
          <textarea v-model.trim="commentText" rows="4" required></textarea>
        </label>
        <button class="primary-button" type="submit" :disabled="isCreatingComment || !commentText">
          {{ isCreatingComment ? 'Posting...' : 'Post comment' }}
        </button>
      </form>
      <div v-else class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to leave a comment.</RouterLink>
      </div>

      <div v-if="isLoadingComments" class="empty-state">Loading comments...</div>
      <div v-else-if="comments.length === 0" class="empty-state">No comments yet.</div>
      <ul v-else class="comment-list">
        <li v-for="comment in comments" :key="comment.id" class="comment-item">
          <div>
            <strong class="user-name-line">
              <UserAvatar :user-id="comment.author_id" :label="commentAuthorLabel(comment)" :avatar-url="avatarUrl" />
              <span>{{ commentAuthorLabel(comment) }}</span>
            </strong>
            <small>{{ formatDate(comment.created_at) }}</small>
          </div>
          <p>{{ comment.text }}</p>
          <button v-if="canDeleteComment(comment)" class="danger-button" type="button" @click="removeComment(comment)">
            Delete
          </button>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import UserAvatar from '../components/UserAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  changeVideo: { type: Function, required: true },
  createComment: { type: Function, required: true },
  deleteComment: { type: Function, required: true },
  isAuthenticated: { type: Boolean, default: false },
  isChangingVideo: { type: Boolean, default: false },
  loadComments: { type: Function, required: true },
  loadVideo: { type: Function, required: true },
  videoUrl: { type: Function, required: true },
  avatarUrl: { type: Function, required: true },
});

defineEmits(['delete-video']);

const route = useRoute();
const video = ref(null);
const comments = ref([]);
const isLoading = ref(false);
const isLoadingComments = ref(false);
const isCreatingComment = ref(false);
const errorMessage = ref('');
const isEditing = ref(false);
const commentText = ref('');
const selectedQuality = ref('');
const pendingDeleteVideo = ref(null);
let processingPollTimerId = null;
const videoTitle = computed(() => video.value?.title || video.value?.original_filename || 'Video');
const canEdit = computed(() => Boolean(video.value && props.currentUser?.id === video.value.author_id));
const qualityOptions = computed(() => {
  const qualities = video.value?.qualities || [];
  return qualities.map((quality) => ({
    value: String(quality.quality),
    label: quality.label || `${quality.quality}p`,
  }));
});
const currentVideoUrl = computed(() => {
  if (!video.value) {
    return '';
  }

  return props.videoUrl(video.value.id, selectedQuality.value || null);
});
const authorLabel = computed(() => {
  if (!video.value) {
    return 'Unknown author';
  }

  if (props.currentUser?.id === video.value.author_id) {
    const currentUserName = [props.currentUser.first_name, props.currentUser.last_name].filter(Boolean).join(' ');
    return currentUserName || props.currentUser.username || 'You';
  }

  const fullName = [video.value.author_first_name, video.value.author_last_name].filter(Boolean).join(' ');
  return fullName || video.value.author_username || 'Unknown author';
});

const form = reactive({
  title: '',
  description: '',
});

async function loadCurrentVideo(loadComments = true) {
  stopProcessingPolling();
  isLoading.value = true;
  errorMessage.value = '';

  try {
    video.value = await props.loadVideo(route.params.videoId);
    resetSelectedQuality();
    resetForm();
    scheduleProcessingPolling();
    if (loadComments) {
      await loadCurrentComments();
    }
  } catch (error) {
    video.value = null;
    errorMessage.value = error.message || 'Video not found.';
  } finally {
    isLoading.value = false;
  }
}

function scheduleProcessingPolling() {
  if (video.value?.status !== 'processing') {
    return;
  }

  processingPollTimerId = window.setTimeout(() => {
    loadCurrentVideo(false);
  }, 5000);
}

function stopProcessingPolling() {
  if (processingPollTimerId) {
    clearTimeout(processingPollTimerId);
    processingPollTimerId = null;
  }
}

async function loadCurrentComments() {
  if (!route.params.videoId) {
    return;
  }

  isLoadingComments.value = true;
  try {
    const response = await props.loadComments(route.params.videoId);
    comments.value = response.comments || [];
  } catch (error) {
    comments.value = [];
  } finally {
    isLoadingComments.value = false;
  }
}

function resetForm() {
  form.title = video.value?.title || '';
  form.description = video.value?.description || '';
}

function resetSelectedQuality() {
  const qualities = video.value?.qualities || [];
  const bestQuality = qualities.reduce((best, quality) => (quality.quality > best.quality ? quality : best), qualities[0]);
  selectedQuality.value = bestQuality ? String(bestQuality.quality) : '';
}

function startEditing() {
  resetForm();
  isEditing.value = true;
}

function cancelEditing() {
  resetForm();
  isEditing.value = false;
}

async function submit() {
  const changedVideo = await props.changeVideo(video.value.id, {
    title: form.title,
    description: form.description,
  });
  video.value = changedVideo;
  resetForm();
  isEditing.value = false;
}

async function submitComment() {
  if (!commentText.value) {
    return;
  }

  isCreatingComment.value = true;
  try {
    const comment = await props.createComment(video.value.id, commentText.value);
    comments.value = [comment, ...comments.value];
    commentText.value = '';
  } finally {
    isCreatingComment.value = false;
  }
}

async function removeComment(comment) {
  await props.deleteComment(comment.id);
  comments.value = comments.value.filter((item) => item.id !== comment.id);
}

function closeDeleteModal() {
  pendingDeleteVideo.value = null;
}

function confirmDeleteVideo() {
  if (pendingDeleteVideo.value) {
    emit('delete-video', pendingDeleteVideo.value);
    closeDeleteModal();
  }
}

function canDeleteComment(comment) {
  return Boolean(props.currentUser?.is_admin || props.currentUser?.id === comment.author_id);
}

function commentAuthorLabel(comment) {
  if (props.currentUser?.id === comment.author_id) {
    const currentUserName = [props.currentUser.first_name, props.currentUser.last_name].filter(Boolean).join(' ');
    return currentUserName || props.currentUser.username || 'You';
  }

  const fullName = [comment.author_first_name, comment.author_last_name].filter(Boolean).join(' ');
  return fullName || comment.author_username || 'Unknown user';
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '';
}

onMounted(loadCurrentVideo);
onUnmounted(stopProcessingPolling);
watch(() => route.params.videoId, loadCurrentVideo);
</script>
