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
        <div v-if="showFallbackQualitySelect" class="quality-select">
          <span>Quality</span>
          <select v-model="selectedQuality">
            <option v-for="quality in sortedQualities" :key="quality.height" :value="String(quality.height)">
              {{ quality.height }}p
            </option>
          </select>
        </div>
        <media-player
          :key="playerKey"
          ref="mediaPlayerElement"
          class="video-player"
          load="eager"
          preload="metadata"
          playsinline
          stream-type="on-demand"
          view-type="video"
          :title="videoTitle"
          :src="activePlayerSource"
          :poster="posterUrl"
        >
          <media-outlet></media-outlet>
          <media-community-skin></media-community-skin>
        </media-player>
      </div>
      <div v-else-if="video?.status === 'processing'" class="empty-state">Video is still processing.</div>
      <div v-else-if="video?.status === 'failed'" class="empty-state">
        {{ video.processing_error || 'Video processing failed.' }}
      </div>
      <div v-else class="empty-state">Video not found.</div>

      <div v-if="video" class="video-meta-strip">
        <RouterLink
          v-if="video.category"
          class="video-category-pill"
          :to="{ path: '/videos', query: { categoryId: String(video.category.id) } }"
        >
          {{ video.category.name }}
        </RouterLink>
        <span v-else class="video-category-pill muted">
          No category
        </span>
      </div>

      <div v-if="video" class="video-engagement-panel">
        <div class="video-engagement-actions">
          <button
            type="button"
            class="engagement-button"
            :class="{ active: currentReaction === 'like' }"
            :disabled="!isAuthenticated || isUpdatingReaction"
            @click="applyReaction('like')"
          >
            <span aria-hidden="true">👍</span><span>{{ formatCount(video.likes_count) }}</span>
          </button>
          <button
            type="button"
            class="engagement-button"
            :class="{ active: currentReaction === 'dislike' }"
            :disabled="!isAuthenticated || isUpdatingReaction"
            @click="applyReaction('dislike')"
          >
            <span aria-hidden="true">👎</span><span>{{ formatCount(video.dislikes_count) }}</span>
          </button>
        </div>
        <small class="video-engagement-views">{{ formatCount(video.views_count) }} views</small>
      </div>

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
            <dt>Category</dt>
            <dd v-if="!isEditing">{{ video.category?.name || 'No category.' }}</dd>
            <dd v-else>
              <select v-model="form.categoryId">
                <option value="">No category</option>
                <option v-for="option in categoryOptions" :key="option.id" :value="String(option.id)">
                  {{ option.label }}
                </option>
              </select>
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
  categories: { type: Array, default: () => [] },
  currentUser: { type: Object, default: null },
  changeVideo: { type: Function, required: true },
  createComment: { type: Function, required: true },
  deleteComment: { type: Function, required: true },
  isAuthenticated: { type: Boolean, default: false },
  isChangingVideo: { type: Boolean, default: false },
  loadComments: { type: Function, required: true },
  getVideoHistory: { type: Function, required: true },
  loadVideo: { type: Function, required: true },
  loadVideoEngagement: { type: Function, required: true },
  registerVideoView: { type: Function, required: true },
  saveVideoHistory: { type: Function, required: true },
  setVideoReaction: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  videoHlsUrl: { type: Function, required: true },
  videoUrl: { type: Function, required: true },
  avatarUrl: { type: Function, required: true },
});

const emit = defineEmits(['delete-video']);

const route = useRoute();
const video = ref(null);
const comments = ref([]);
const isLoading = ref(false);
const isLoadingComments = ref(false);
const isCreatingComment = ref(false);
const isUpdatingReaction = ref(false);
const errorMessage = ref('');
const isEditing = ref(false);
const commentText = ref('');
const pendingDeleteVideo = ref(null);
const mediaPlayerElement = ref(null);
let processingPollTimerId = null;
let historySaveTimerId = null;
let lastRegisteredViewVideoId = null;
let lastSavedHistoryPosition = -1;
const selectedQuality = ref('');
const videoTitle = computed(() => video.value?.title || video.value?.original_filename || 'Video');
const canEdit = computed(() => Boolean(video.value && props.currentUser?.id === video.value.author_id));
const currentReaction = computed(() => video.value?.user_reaction || null);
const sortedQualities = computed(() => [...(video.value?.qualities || [])].sort((left, right) => right.height - left.height));
const showFallbackQualitySelect = computed(() => !video.value?.has_hls && sortedQualities.value.length > 1);
const posterUrl = computed(() => (video.value ? props.videoThumbnailUrl(video.value.id) : ''));
const activePlayerSource = computed(() => {
  if (!video.value) {
    return '';
  }

  if (video.value.has_hls) {
    return props.videoHlsUrl(video.value.id);
  }

  return props.videoUrl(video.value.id, selectedQuality.value || null);
});
const playerKey = computed(() => `${video.value?.id || 'video'}:${activePlayerSource.value}`);
const categoryOptions = computed(() => flattenCategories(props.categories));
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
  categoryId: '',
});

async function loadCurrentVideo(loadComments = true) {
  stopProcessingPolling();
  isLoading.value = true;
  errorMessage.value = '';

  try {
    video.value = await props.loadVideo(route.params.videoId);
    resetForm();
    resetSelectedQuality();
    scheduleProcessingPolling();
    if (loadComments) {
      await loadCurrentComments();
    }
    maybeRegisterView();
    await restoreWatchHistory();
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

function clearHistorySaveTimer() {
  if (historySaveTimerId) {
    clearInterval(historySaveTimerId);
    historySaveTimerId = null;
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
  form.categoryId = video.value?.category_id ? String(video.value.category_id) : '';
}

function resetSelectedQuality() {
  selectedQuality.value = sortedQualities.value[0] ? String(sortedQualities.value[0].height) : '';
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
    category_id: form.categoryId ? Number(form.categoryId) : null,
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

async function refreshEngagement() {
  if (!video.value) {
    return;
  }

  const summary = await props.loadVideoEngagement(video.value.id);
  video.value = {
    ...video.value,
    likes_count: summary.likes_count,
    dislikes_count: summary.dislikes_count,
    views_count: summary.views_count,
    user_reaction: summary.user_reaction,
  };
}

function getMediaElement() {
  return mediaPlayerElement.value?.querySelector('video') || null;
}

async function restoreWatchHistory() {
  if (!video.value || !props.isAuthenticated || video.value.status !== 'ready') {
    return;
  }

  try {
    const history = await props.getVideoHistory(video.value.id);
    if (!history?.last_position_seconds || history.completed) {
      return;
    }

    let attempts = 0;
    const applyPosition = () => {
      const media = getMediaElement();
      if (!media) {
        attempts += 1;
        if (attempts < 10) {
          window.setTimeout(applyPosition, 300);
        }
        return;
      }

      media.currentTime = history.last_position_seconds;
      lastSavedHistoryPosition = history.last_position_seconds;
    };

    applyPosition();
  } catch {
    // No history entry yet.
  }
}

function startHistorySync() {
  clearHistorySaveTimer();
  if (!props.isAuthenticated || !video.value || video.value.status !== 'ready') {
    return;
  }

  historySaveTimerId = window.setInterval(() => {
    saveWatchHistoryProgress();
  }, 15000);
}

async function saveWatchHistoryProgress(force = false) {
  if (!props.isAuthenticated || !video.value || video.value.status !== 'ready') {
    return;
  }

  const media = getMediaElement();
  if (!media || !Number.isFinite(media.currentTime)) {
    return;
  }

  const position = Math.max(0, media.currentTime || 0);
  const duration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : null;
  const completed = Boolean(duration && position >= Math.max(duration - 5, duration * 0.95));

  if (!force && Math.abs(position - lastSavedHistoryPosition) < 10 && !completed) {
    return;
  }

  lastSavedHistoryPosition = position;
  try {
    await props.saveVideoHistory(video.value.id, {
      last_position_seconds: position,
      duration_seconds: duration,
      completed,
    });
  } catch {
    // Ignore intermittent history sync failures.
  }
}

async function applyReaction(targetReaction) {
  if (!video.value || !props.isAuthenticated || isUpdatingReaction.value) {
    return;
  }

  isUpdatingReaction.value = true;
  try {
    const nextReaction = currentReaction.value === targetReaction ? 'none' : targetReaction;
    const summary = await props.setVideoReaction(video.value.id, nextReaction);
    video.value = {
      ...video.value,
      likes_count: summary.likes_count,
      dislikes_count: summary.dislikes_count,
      views_count: summary.views_count,
      user_reaction: summary.user_reaction,
    };
  } finally {
    isUpdatingReaction.value = false;
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

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

async function maybeRegisterView() {
  if (!video.value || video.value.status !== 'ready' || lastRegisteredViewVideoId === video.value.id) {
    return;
  }

  lastRegisteredViewVideoId = video.value.id;
  const summary = await props.registerVideoView(video.value.id);
  if (!summary) {
    return;
  }

  video.value = {
    ...video.value,
    likes_count: summary.likes_count,
    dislikes_count: summary.dislikes_count,
    views_count: summary.views_count,
    user_reaction: summary.user_reaction,
  };
}

function flattenCategories(categories, level = 0) {
  return categories.flatMap((category) => [
    {
      id: category.id,
      label: `${'— '.repeat(level)}${category.name}`,
    },
    ...flattenCategories(category.children || [], level + 1),
  ]);
}

onMounted(loadCurrentVideo);
onUnmounted(() => {
  saveWatchHistoryProgress(true);
  clearHistorySaveTimer();
  stopProcessingPolling();
});
watch(() => route.params.videoId, loadCurrentVideo);
watch(() => [video.value?.id, video.value?.status], ([videoId, status]) => {
  if (videoId && status === 'ready') {
    maybeRegisterView();
    restoreWatchHistory();
    startHistorySync();
  }
  if (status !== 'ready') {
    lastRegisteredViewVideoId = null;
    lastSavedHistoryPosition = -1;
    clearHistorySaveTimer();
  }
  resetSelectedQuality();
});
</script>
