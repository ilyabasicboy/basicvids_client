<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Videos</p>
          <h2>User videos</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="isAuthenticated" class="ghost-link" to="/videos/upload">Upload video</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh user videos" @click="loadVideos(currentPage)">
            ↻
          </button>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to view your videos.</RouterLink>
      </div>
      <template v-else>
        <form class="video-search-form" role="search" @submit.prevent="searchVideos()">
          <label for="user-video-search">Search videos</label>
          <div class="video-search-row">
            <div class="search-input-wrap">
              <input
                id="user-video-search"
                v-model="searchQuery"
                type="search"
                class="search-input"
                placeholder="Search by title or description"
                autocomplete="off"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="search-clear-button"
                aria-label="Clear search"
                @click="clearSearch"
              >
                ×
              </button>
            </div>
            <button type="submit" class="ghost-button">Search</button>
          </div>
        </form>

        <div v-if="isLoadingVideos && displayedVideos.length === 0" class="empty-state">Loading videos...</div>
        <div v-else-if="displayedVideos.length === 0" class="empty-state">
          {{ searchQuery.trim() ? 'No user videos match your search.' : 'No videos uploaded by this user yet.' }}
        </div>
        <div v-else class="video-list-frame" :class="{ loading: isLoadingVideos }">
          <ul class="video-list">
            <li v-for="video in displayedVideos" :key="video.id" class="video-item">
              <article class="video-card">
                <RouterLink class="video-card-link" :to="`/videos/${video.id}`">
                  <div
                    class="video-tile"
                    :class="{ fallback: !video.has_thumbnail }"
                    :style="videoTileStyle(video)"
                  >
                    <div v-if="!video.has_thumbnail" class="video-tile-initial">{{ getInitial(video.title || video.original_filename) }}</div>
                    <small v-if="video.status !== 'ready'" class="video-status-badge" :class="video.status">{{ statusLabel(video) }}</small>
                    <small v-if="video.duration_seconds" class="video-duration-badge">{{ formatDuration(video.duration_seconds) }}</small>
                  </div>
                  <div class="video-card-meta">
                    <div class="video-card-title-link">
                    <strong class="video-card-title">{{ video.title || video.original_filename }}</strong>
                    </div>
                    <small class="video-author-line user-name-line video-card-author">
                      <UserAvatar :user-id="video.author_id" :label="authorLabel(video)" :avatar-url="avatarUrl" />
                      <span>{{ authorLabel(video) }}</span>
                    </small>
                    <small class="video-card-age">{{ formatRelativeTime(video.created_at) }}</small>
                  </div>
                </RouterLink>
                <button
                  v-if="canDelete(video)"
                  class="video-tile-delete"
                  type="button"
                  :aria-label="`Delete ${video.title || video.original_filename}`"
                  @click="requestDeleteVideo(video)"
                >
                  X
                </button>
              </article>
            </li>
          </ul>
          <div v-if="isLoadingVideos" class="video-list-loader" role="status" aria-label="Searching videos">
            <span class="video-list-spinner" aria-hidden="true"></span>
          </div>
        </div>

        <nav v-if="displayedVideos.length > 0 && videosCount > pageSize" class="pagination" aria-label="User videos pages">
          <button type="button" class="ghost-button" :disabled="isLoadingVideos || currentPage <= 1" @click="goToPage(1)">
            First
          </button>
          <div class="pagination-pages" aria-label="Page numbers">
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              class="pagination-page"
              :class="{ active: page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              :disabled="isLoadingVideos || page === currentPage"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          <button type="button" class="ghost-button" :disabled="isLoadingVideos || currentPage >= totalPages" @click="goToPage(totalPages)">
            Last
          </button>
          <span class="pagination-range">{{ pageStart }}-{{ pageEnd }} of {{ videosCount }}</span>
        </nav>

        <Transition name="modal">
          <div v-if="pendingDeleteVideo" class="modal-backdrop" role="presentation" @click.self="closeDeleteModal">
            <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-user-video-title">
              <div class="panel-heading">
                <p class="eyebrow">Confirm</p>
                <h2 id="delete-user-video-title">Delete video</h2>
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
      </template>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import UserAvatar from '../components/UserAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  videos: { type: Array, default: () => [] },
  videosCount: { type: Number, default: 0 },
  isAuthenticated: { type: Boolean, default: false },
  isLoadingVideos: { type: Boolean, default: false },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  avatarUrl: { type: Function, required: true },
});

const emit = defineEmits(['delete-video', 'load-videos']);
const pageSize = 30;
const searchQuery = ref('');
const currentPage = ref(1);
const displayedVideos = ref([...props.videos]);
const pendingDeleteVideo = ref(null);
let searchTimerId = null;

const totalPages = computed(() => Math.max(1, Math.ceil(props.videosCount / pageSize)));
const pageStart = computed(() => (props.videosCount === 0 ? 0 : (currentPage.value - 1) * pageSize + 1));
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, props.videosCount));

watch(
  () => [props.videos, props.isLoadingVideos],
  ([videos, isLoadingVideos]) => {
    if (!isLoadingVideos) {
      displayedVideos.value = [...videos];
    }
  },
);

watch(searchQuery, () => {
  clearPendingSearchTimer();
  searchTimerId = window.setTimeout(() => {
    searchVideos();
  }, 300);
});

onUnmounted(() => {
  clearPendingSearchTimer();
});

onMounted(() => {
  if (props.isAuthenticated && props.currentUser?.id) {
    loadVideos(1);
  }
});

watch(
  () => props.currentUser?.id,
  (userId) => {
    if (props.isAuthenticated && userId) {
      loadVideos(1);
    }
  },
);

function clearPendingSearchTimer() {
  if (searchTimerId) {
    clearTimeout(searchTimerId);
    searchTimerId = null;
  }
}

function loadVideos(page = currentPage.value) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
  emit('load-videos', {
    search: searchQuery.value.trim(),
    offset: (currentPage.value - 1) * pageSize,
    limit: pageSize,
    authorId: props.currentUser?.id || null,
  });
}

function searchVideos() {
  clearPendingSearchTimer();
  loadVideos(1);
}

function clearSearch() {
  clearPendingSearchTimer();
  searchQuery.value = '';
  loadVideos(1);
}

function goToPage(page) {
  loadVideos(page);
}

function canDelete(video) {
  return Boolean(props.currentUser?.is_admin || (props.currentUser?.id && props.currentUser.id === video.author_id));
}

function requestDeleteVideo(video) {
  pendingDeleteVideo.value = video;
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

function authorLabel(video) {
  if (props.currentUser?.id === video.author_id) {
    const currentUserName = [props.currentUser.first_name, props.currentUser.last_name].filter(Boolean).join(' ');
    return currentUserName || props.currentUser.username || 'You';
  }

  const fullName = [video.author_first_name, video.author_last_name].filter(Boolean).join(' ');
  return fullName || video.author_username || 'Unknown author';
}

function statusLabel(video) {
  if (video.status === 'processing') {
    return 'Processing';
  }
  if (video.status === 'failed') {
    return 'Failed';
  }
  return 'Ready';
}

function pluralizeRu(value, forms) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}

function formatDuration(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const ranges = [
    { limit: 60, unitSeconds: 1, forms: ['секунду', 'секунды', 'секунд'] },
    { limit: 3600, unitSeconds: 60, forms: ['минуту', 'минуты', 'минут'] },
    { limit: 86400, unitSeconds: 3600, forms: ['час', 'часа', 'часов'] },
    { limit: 2592000, unitSeconds: 86400, forms: ['день', 'дня', 'дней'] },
    { limit: 31536000, unitSeconds: 2592000, forms: ['месяц', 'месяца', 'месяцев'] },
    { limit: Number.POSITIVE_INFINITY, unitSeconds: 31536000, forms: ['год', 'года', 'лет'] },
  ];

  for (const range of ranges) {
    if (diffSeconds < range.limit) {
      const amount = Math.max(1, Math.floor(diffSeconds / range.unitSeconds));
      return `${amount} ${pluralizeRu(amount, range.forms)} назад`;
    }
  }
  return '';
}

function videoTileStyle(video) {
  if (!video.has_thumbnail) {
    return {};
  }
  return {
    backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")`,
  };
}
</script>
