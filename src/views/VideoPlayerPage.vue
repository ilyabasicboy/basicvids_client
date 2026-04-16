<template>
  <section class="video-player-page">
    <article class="panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Player</p>
          <h2>{{ videoTitle }}</h2>
        </div>
        <div class="form-actions">
          <button v-if="canEdit" class="danger-button" type="button" @click="$emit('delete-video', video)">
            Delete video
          </button>
          <RouterLink class="ghost-link" to="/videos">Back to videos</RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state">Loading video...</div>
      <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
      <video v-else-if="video" class="video-player" :src="videoUrl(video.id)" controls preload="metadata">
        Your browser cannot play this video.
      </video>
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
            <dd>{{ authorLabel }}</dd>
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
            <strong>{{ commentAuthorLabel(comment) }}</strong>
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

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
const videoTitle = computed(() => video.value?.title || video.value?.original_filename || 'Video');
const canEdit = computed(() => Boolean(video.value && props.currentUser?.id === video.value.author_id));
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

async function loadCurrentVideo() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    video.value = await props.loadVideo(route.params.videoId);
    resetForm();
    await loadCurrentComments();
  } catch (error) {
    video.value = null;
    errorMessage.value = error.message || 'Video not found.';
  } finally {
    isLoading.value = false;
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
watch(() => route.params.videoId, loadCurrentVideo);
</script>
