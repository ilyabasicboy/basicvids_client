<template>
  <section class="video-player-page" :class="{ 'with-playlist-queue': showPlaylistQueue }">
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
        <div v-if="showPlaylistQueue" class="playlist-player-controls">
          <button type="button" :disabled="!previousPlaylistItem" @click="playPreviousPlaylistVideo">
            Previous
          </button>
          <button type="button" :disabled="!nextPlaylistItem" @click="playNextPlaylistVideo(false)">
            Next
          </button>
        </div>
      </div>
      <div v-else-if="video?.status === 'processing'" class="empty-state">Video is still processing.</div>
      <div v-else-if="video?.status === 'failed'" class="empty-state">
        {{ video.processing_error || 'Video processing failed.' }}
      </div>
      <div v-else class="empty-state">Video not found.</div>

      <div v-if="video" class="video-meta-strip">
        <RouterLink
          v-if="videoChannel"
          class="video-channel-pill"
          :to="`/channels/${videoChannel.id}`"
        >
          <span class="video-channel-mark">{{ getInitial(videoChannel.name) }}</span>
          <span>{{ videoChannel.name }}</span>
        </RouterLink>
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
            class="engagement-button save-button"
            :class="{ active: video.is_favorite }"
            :disabled="!isAuthenticated || isUpdatingFavorite"
            @click="toggleCurrentVideoFavorite"
          >
            <span aria-hidden="true">★</span><span>Save</span>
          </button>
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

      <aside v-if="showPlaylistQueue" class="playlist-queue-panel" aria-labelledby="playlist-queue-title">
        <div class="playlist-queue-head">
          <div>
            <p class="eyebrow">Playlist</p>
            <h3 id="playlist-queue-title">{{ playlistContext?.title || 'Playlist queue' }}</h3>
          </div>
          <RouterLink v-if="playlistRouteContext" class="ghost-link" :to="playlistPageRoute">
            Open playlist
          </RouterLink>
        </div>
        <label class="playlist-autoplay-toggle">
          <input v-model="playlistAutoplay" type="checkbox" />
          <span>Autoplay next</span>
        </label>
        <ul class="playlist-queue-list">
          <li
            v-for="(item, index) in playlistItems"
            :key="item.id"
            class="playlist-queue-item"
            :class="{ active: item.video_id === video?.id }"
            :data-playlist-video-id="item.video_id"
          >
            <RouterLink v-if="item.video" class="playlist-queue-link" :to="playlistVideoRoute(item.video_id)">
              <span class="playlist-queue-index">{{ index + 1 }}</span>
              <span class="playlist-queue-thumb" :class="{ fallback: !item.video.has_thumbnail }" :style="videoTileStyle(item.video)">
                <span v-if="!item.video.has_thumbnail">{{ getInitial(item.video.title || item.video.original_filename) }}</span>
              </span>
              <span class="playlist-queue-copy">
                <strong>{{ item.video.title || item.video.original_filename }}</strong>
                <small>{{ item.video_id === video?.id ? 'Now playing' : 'Play from playlist' }}</small>
              </span>
            </RouterLink>
            <div v-else class="playlist-queue-missing">
              <span class="playlist-queue-index">{{ index + 1 }}</span>
              <span>Video unavailable</span>
            </div>
          </li>
        </ul>
      </aside>

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
import { RouterLink, useRoute, useRouter } from 'vue-router';
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
  loadVideoChannel: { type: Function, required: true },
  loadChannelPlaylist: { type: Function, required: true },
  loadVideoEngagement: { type: Function, required: true },
  registerVideoView: { type: Function, required: true },
  saveVideoHistory: { type: Function, required: true },
  setVideoReaction: { type: Function, required: true },
  toggleFavoriteVideo: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  videoHlsUrl: { type: Function, required: true },
  videoUrl: { type: Function, required: true },
  avatarUrl: { type: Function, required: true },
});

const emit = defineEmits(['delete-video']);

const route = useRoute();
const router = useRouter();
const video = ref(null);
const videoChannel = ref(null);
const playlistContext = ref(null);
const comments = ref([]);
const isLoading = ref(false);
const isLoadingComments = ref(false);
const isCreatingComment = ref(false);
const isUpdatingReaction = ref(false);
const isUpdatingFavorite = ref(false);
const errorMessage = ref('');
const isEditing = ref(false);
const commentText = ref('');
const pendingDeleteVideo = ref(null);
const mediaPlayerElement = ref(null);
let processingPollTimerId = null;
let historySaveTimerId = null;
let lastRegisteredViewVideoId = null;
let lastSavedHistoryPosition = -1;
let trackedPlayerElement = null;
let detachHistoryListeners = null;
let pendingHistoryPosition = null;
let restoredHistoryVideoId = null;
let playlistAdvanceInProgress = false;
let playlistProgressTimerId = null;
let lastKnownPlaybackDuration = null;
const selectedQuality = ref('');
const playlistAutoplay = ref(localStorage.getItem('basicvids_playlist_autoplay') !== '0');
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
const playlistRouteContext = computed(() => {
  const channelId = typeof route.query.channelId === 'string' ? route.query.channelId : '';
  const playlistId = typeof route.query.playlistId === 'string' ? route.query.playlistId : '';
  return channelId && playlistId ? { channelId, playlistId } : null;
});
const playlistItems = computed(() => [...(playlistContext.value?.items || [])].sort((left, right) => left.position - right.position));
const currentPlaylistIndex = computed(() => playlistItems.value.findIndex((item) => item.video_id === video.value?.id));
const showPlaylistQueue = computed(() => Boolean(playlistRouteContext.value && playlistContext.value && currentPlaylistIndex.value >= 0));
const playlistPageRoute = computed(() => {
  if (!playlistRouteContext.value) {
    return '/videos';
  }
  return `/channels/${playlistRouteContext.value.channelId}/playlists/${playlistRouteContext.value.playlistId}`;
});
const previousPlaylistItem = computed(() => (
  currentPlaylistIndex.value > 0 ? playlistItems.value[currentPlaylistIndex.value - 1] || null : null
));
const nextPlaylistItem = computed(() => (
  currentPlaylistIndex.value >= 0 ? playlistItems.value[currentPlaylistIndex.value + 1] || null : null
));
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

function getInitial(value = '') {
  return value.trim().charAt(0).toUpperCase() || 'C';
}

async function loadCurrentVideo(loadComments = true) {
  stopProcessingPolling();
  isLoading.value = true;
  errorMessage.value = '';

  try {
    video.value = await props.loadVideo(route.params.videoId);
    await loadCurrentVideoChannel();
    await loadPlaylistContext();
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
    videoChannel.value = null;
    playlistContext.value = null;
    errorMessage.value = error.message || 'Video not found.';
  } finally {
    isLoading.value = false;
  }
}

async function loadPlaylistContext() {
  playlistContext.value = null;
  if (!playlistRouteContext.value) {
    return;
  }

  try {
    playlistContext.value = await props.loadChannelPlaylist(
      playlistRouteContext.value.channelId,
      playlistRouteContext.value.playlistId,
    );
  } catch {
    playlistContext.value = null;
  }
}

async function loadCurrentVideoChannel() {
  videoChannel.value = null;
  if (!video.value?.id) {
    return;
  }

  try {
    videoChannel.value = await props.loadVideoChannel(video.value.id);
  } catch {
    videoChannel.value = null;
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

function stopPlaylistProgressPolling() {
  if (playlistProgressTimerId) {
    clearInterval(playlistProgressTimerId);
    playlistProgressTimerId = null;
  }
}

function startPlaylistProgressPolling() {
  stopPlaylistProgressPolling();
  if (!showPlaylistQueue.value || !playlistAutoplay.value || !nextPlaylistItem.value?.video_id) {
    return;
  }

  playlistProgressTimerId = window.setInterval(() => {
    maybeAdvancePlaylistFromProgress();
  }, 500);
}

function syncPlaylistProgressPolling() {
  if (showPlaylistQueue.value && playlistAutoplay.value && nextPlaylistItem.value?.video_id) {
    startPlaylistProgressPolling();
  } else {
    stopPlaylistProgressPolling();
  }
}

function detachMediaHistoryTracking() {
  if (detachHistoryListeners) {
    detachHistoryListeners();
    detachHistoryListeners = null;
  }
  trackedPlayerElement = null;
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

function getPlayerElement() {
  return mediaPlayerElement.value || null;
}

function unwrapPlaybackValue(value) {
  if (typeof value === 'function') {
    try {
      return value();
    } catch {
      return null;
    }
  }

  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}

function readFiniteNumber(...values) {
  for (const value of values) {
    const unwrappedValue = unwrapPlaybackValue(value);
    if (unwrappedValue == null || unwrappedValue === '') {
      continue;
    }

    const numberValue = Number(unwrappedValue);
    if (Number.isFinite(numberValue)) {
      return numberValue;
    }
  }

  return null;
}

function getNativeMediaElement(root = getPlayerElement()) {
  if (!root) {
    return null;
  }

  const selectors = ['video', 'audio', 'media-outlet video', 'media-outlet audio'];
  for (const selector of selectors) {
    const element = root.querySelector?.(selector);
    if (element) {
      return element;
    }
  }

  const outlet = root.querySelector?.('media-outlet');
  return root.shadowRoot?.querySelector?.('video, audio')
    || outlet?.shadowRoot?.querySelector?.('video, audio')
    || null;
}

function getPlaybackTiming(event = null) {
  const player = getPlayerElement();
  const nativeMedia = getNativeMediaElement(player);
  const detail = event?.detail || {};
  const state = player?.state || player?.mediaState || {};
  const duration = readFiniteNumber(
    detail.duration,
    player?.duration,
    state.duration,
    nativeMedia?.duration,
    lastKnownPlaybackDuration,
    video.value?.duration_seconds,
  );
  const currentTime = readFiniteNumber(
    detail.currentTime,
    detail.time,
    player?.currentTime,
    state.currentTime,
    nativeMedia?.currentTime,
  );

  if (duration && duration > 0) {
    lastKnownPlaybackDuration = duration;
  }

  return { currentTime, duration };
}

function playlistVideoRoute(videoId) {
  if (!playlistRouteContext.value) {
    return `/videos/${videoId}`;
  }

  return {
    path: `/videos/${videoId}`,
    query: {
      channelId: playlistRouteContext.value.channelId,
      playlistId: playlistRouteContext.value.playlistId,
    },
  };
}

function applyPendingHistoryPosition() {
  const player = getPlayerElement();
  if (!player || pendingHistoryPosition == null) {
    return;
  }

  const { duration } = getPlaybackTiming();
  if (!duration || duration <= 0) {
    return;
  }

  player.currentTime = pendingHistoryPosition;
  lastSavedHistoryPosition = pendingHistoryPosition;
  pendingHistoryPosition = null;
}

async function restoreWatchHistory() {
  if (!video.value || !props.isAuthenticated || video.value.status !== 'ready') {
    return;
  }

  if (restoredHistoryVideoId === video.value.id) {
    applyPendingHistoryPosition();
    return;
  }

  try {
    const history = await props.getVideoHistory(video.value.id);
    if (!history?.last_position_seconds || history.completed) {
      restoredHistoryVideoId = video.value.id;
      pendingHistoryPosition = null;
      return;
    }

    restoredHistoryVideoId = video.value.id;
    pendingHistoryPosition = history.last_position_seconds;
    applyPendingHistoryPosition();
  } catch {
    // No history entry yet.
    restoredHistoryVideoId = video.value.id;
    pendingHistoryPosition = null;
  }
}

function startHistorySync() {
  clearHistorySaveTimer();
  if (!props.isAuthenticated || !video.value || video.value.status !== 'ready') {
    return;
  }

  historySaveTimerId = window.setInterval(() => {
    saveWatchHistoryProgress();
  }, 5000);
}

async function saveWatchHistoryProgress(force = false, event = null) {
  if (!props.isAuthenticated || !video.value || video.value.status !== 'ready') {
    return;
  }

  const { currentTime, duration } = getPlaybackTiming(event);
  if (currentTime == null) {
    return;
  }

  const position = Math.max(0, currentTime || 0);
  const normalizedDuration = duration && duration > 0 ? duration : null;
  const completed = Boolean(normalizedDuration && position >= Math.max(normalizedDuration - 5, normalizedDuration * 0.95));

  if (!force && Math.abs(position - lastSavedHistoryPosition) < 10 && !completed) {
    return;
  }

  lastSavedHistoryPosition = position;
  try {
    await props.saveVideoHistory(video.value.id, {
      last_position_seconds: position,
      duration_seconds: normalizedDuration,
      completed,
    });
  } catch {
    // Ignore intermittent history sync failures.
  }
}

function attachMediaHistoryTracking() {
  const player = getPlayerElement();
  if (!player || trackedPlayerElement === player) {
    applyPendingHistoryPosition();
    return;
  }

  detachMediaHistoryTracking();
  trackedPlayerElement = player;

  const handleLoadedMetadata = () => {
    applyPendingHistoryPosition();
  };
  const handleCanPlay = (event) => {
    getPlaybackTiming(event);
    applyPendingHistoryPosition();
  };
  const handleDurationChange = (event) => {
    getPlaybackTiming(event);
  };
  const handlePause = (event) => {
    saveWatchHistoryProgress(true, event);
  };
  const handleEnded = (event) => {
    saveWatchHistoryProgress(true, event);
    void playNextPlaylistVideo(true);
  };
  const handleTimeUpdate = (event) => {
    saveWatchHistoryProgress(false, event);
    maybeAdvancePlaylistFromProgress(event);
  };

  let nativeMedia = null;
  const detachNativeMediaListeners = () => {
    if (!nativeMedia) {
      return;
    }

    nativeMedia.removeEventListener('loadedmetadata', handleLoadedMetadata);
    nativeMedia.removeEventListener('durationchange', handleDurationChange);
    nativeMedia.removeEventListener('canplay', handleCanPlay);
    nativeMedia.removeEventListener('pause', handlePause);
    nativeMedia.removeEventListener('ended', handleEnded);
    nativeMedia.removeEventListener('timeupdate', handleTimeUpdate);
    nativeMedia = null;
  };
  const attachNativeMediaListeners = () => {
    const nextNativeMedia = getNativeMediaElement(player);
    if (!nextNativeMedia || nextNativeMedia === nativeMedia) {
      return;
    }

    detachNativeMediaListeners();
    nativeMedia = nextNativeMedia;
    nativeMedia.addEventListener('loadedmetadata', handleLoadedMetadata);
    nativeMedia.addEventListener('durationchange', handleDurationChange);
    nativeMedia.addEventListener('canplay', handleCanPlay);
    nativeMedia.addEventListener('pause', handlePause);
    nativeMedia.addEventListener('ended', handleEnded);
    nativeMedia.addEventListener('timeupdate', handleTimeUpdate);
  };

  player.addEventListener('loaded-metadata', handleLoadedMetadata);
  player.addEventListener('duration-change', handleDurationChange);
  player.addEventListener('can-play', handleCanPlay);
  player.addEventListener('provider-change', attachNativeMediaListeners);
  player.addEventListener('provider-setup', attachNativeMediaListeners);
  player.addEventListener('pause', handlePause);
  player.addEventListener('end', handleEnded);
  player.addEventListener('ended', handleEnded);
  player.addEventListener('media-ended', handleEnded);
  player.addEventListener('time-update', handleTimeUpdate);
  player.addEventListener('timeupdate', handleTimeUpdate);
  attachNativeMediaListeners();

  detachHistoryListeners = () => {
    detachNativeMediaListeners();
    player.removeEventListener('loaded-metadata', handleLoadedMetadata);
    player.removeEventListener('duration-change', handleDurationChange);
    player.removeEventListener('can-play', handleCanPlay);
    player.removeEventListener('provider-change', attachNativeMediaListeners);
    player.removeEventListener('provider-setup', attachNativeMediaListeners);
    player.removeEventListener('pause', handlePause);
    player.removeEventListener('end', handleEnded);
    player.removeEventListener('ended', handleEnded);
    player.removeEventListener('media-ended', handleEnded);
    player.removeEventListener('time-update', handleTimeUpdate);
    player.removeEventListener('timeupdate', handleTimeUpdate);
  };

  applyPendingHistoryPosition();
}

function maybeAdvancePlaylistFromProgress(event = null) {
  if (!showPlaylistQueue.value || !playlistAutoplay.value || !nextPlaylistItem.value?.video_id) {
    return;
  }

  const { currentTime, duration } = getPlaybackTiming(event);
  if (currentTime == null || !duration || duration <= 0) {
    return;
  }

  if (currentTime >= duration - 0.75) {
    void playNextPlaylistVideo(true);
  }
}

async function playPreviousPlaylistVideo() {
  if (!showPlaylistQueue.value || !previousPlaylistItem.value?.video_id) {
    return;
  }

  await router.push(playlistVideoRoute(previousPlaylistItem.value.video_id));
}

async function playNextPlaylistVideo(fromAutoplay = false) {
  if (playlistAdvanceInProgress) {
    return;
  }
  if (!showPlaylistQueue.value || !nextPlaylistItem.value?.video_id) {
    return;
  }
  if (fromAutoplay && !playlistAutoplay.value) {
    return;
  }

  playlistAdvanceInProgress = true;
  try {
    await router.push(playlistVideoRoute(nextPlaylistItem.value.video_id));
  } finally {
    window.setTimeout(() => {
      playlistAdvanceInProgress = false;
    }, 500);
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    saveWatchHistoryProgress(true);
  }
}

function handlePageHide() {
  saveWatchHistoryProgress(true);
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

async function toggleCurrentVideoFavorite() {
  if (!video.value || isUpdatingFavorite.value) {
    return;
  }

  isUpdatingFavorite.value = true;
  try {
    const nextValue = await props.toggleFavoriteVideo(video.value);
    video.value = {
      ...video.value,
      is_favorite: nextValue,
    };
  } finally {
    isUpdatingFavorite.value = false;
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

function videoTileStyle(itemVideo) {
  return itemVideo?.has_thumbnail ? { backgroundImage: `url("${props.videoThumbnailUrl(itemVideo.id)}")` } : {};
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
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
});
onUnmounted(() => {
  saveWatchHistoryProgress(true);
  detachMediaHistoryTracking();
  clearHistorySaveTimer();
  stopPlaylistProgressPolling();
  stopProcessingPolling();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('pagehide', handlePageHide);
});
watch(() => route.params.videoId, loadCurrentVideo);
watch(() => route.params.videoId, () => {
  playlistAdvanceInProgress = false;
  lastKnownPlaybackDuration = null;
});
watch(() => [route.query.channelId, route.query.playlistId], () => {
  loadCurrentVideo(false);
});
watch(playlistAutoplay, (value) => {
  localStorage.setItem('basicvids_playlist_autoplay', value ? '1' : '0');
  syncPlaylistProgressPolling();
});
watch(showPlaylistQueue, (visible) => {
  syncPlaylistProgressPolling();
  if (!visible || !video.value?.id) {
    return;
  }
  window.setTimeout(() => {
    document
      .querySelector(`[data-playlist-video-id="${CSS.escape(video.value.id)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, 0);
});
watch(() => [video.value?.id, video.value?.status], ([videoId, status]) => {
  if (videoId && status === 'ready') {
    maybeRegisterView();
    restoreWatchHistory();
    startHistorySync();
    syncPlaylistProgressPolling();
    window.setTimeout(() => {
      attachMediaHistoryTracking();
    }, 0);
  }
  if (status !== 'ready') {
    lastRegisteredViewVideoId = null;
    lastSavedHistoryPosition = -1;
    restoredHistoryVideoId = null;
    pendingHistoryPosition = null;
    clearHistorySaveTimer();
    stopPlaylistProgressPolling();
    detachMediaHistoryTracking();
  }
  resetSelectedQuality();
});
watch(activePlayerSource, () => {
  window.setTimeout(() => {
    attachMediaHistoryTracking();
    applyPendingHistoryPosition();
  }, 0);
});
watch(nextPlaylistItem, syncPlaylistProgressPolling);
</script>
