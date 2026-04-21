<template>
  <section class="library-grid">
    <article class="panel library-panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Videos</p>
          <h2>Library</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="isAuthenticated" class="ghost-link" to="/user-videos">User videos</RouterLink>
          <RouterLink v-else class="ghost-link" to="/auth">Sign in to upload</RouterLink>
          <button type="button" class="ghost-button" @click="loadVideos(currentPage)">Refresh</button>
        </div>
      </div>

      <form class="video-search-form" role="search" @submit.prevent="searchVideos()">
        <label for="video-search">Search videos</label>
        <div class="video-search-row">
          <input
            id="video-search"
            v-model="searchQuery"
            type="search"
            placeholder="Search by title or description"
            autocomplete="off"
          />
          <button type="submit" class="ghost-button">Search</button>
          <button v-if="searchQuery" type="button" class="ghost-button" @click="clearSearch()">Clear</button>
        </div>
      </form>

      <div v-if="isLoadingVideos && displayedVideos.length === 0" class="empty-state">Loading videos...</div>
      <div v-else-if="displayedVideos.length === 0" class="empty-state">
        {{ searchQuery.trim() ? 'No videos match your search.' : 'No videos uploaded yet.' }}
      </div>
      <div v-else class="video-list-frame" :class="{ loading: isLoadingVideos }">
        <ul class="video-list">
          <li v-for="video in displayedVideos" :key="video.id" class="video-item">
            <RouterLink
              class="video-tile"
            :class="{ fallback: !video.has_thumbnail }"
            :style="videoTileStyle(video)"
            :to="`/videos/${video.id}`"
          >
            <div v-if="!video.has_thumbnail" class="video-tile-initial">{{ getInitial(video.title || video.original_filename) }}</div>
            <span class="video-play-icon" aria-hidden="true"></span>
            <div class="video-tile-content">
              <small v-if="video.status !== 'ready'" class="video-status-badge" :class="video.status">{{ statusLabel(video) }}</small>
              <strong>{{ video.title || video.original_filename }}</strong>
              <small class="video-author-line user-name-line">
                <UserAvatar :user-id="video.author_id" :label="authorLabel(video)" :avatar-url="avatarUrl" />
                <span>{{ authorLabel(video) }}</span>
              </small>
              </div>
            </RouterLink>
            <button
              v-if="canDelete(video)"
              class="video-tile-delete"
              type="button"
              :aria-label="`Delete ${video.title || video.original_filename}`"
              @click="$emit('delete-video', video)"
            >
              X
            </button>
          </li>
        </ul>
        <div v-if="isLoadingVideos" class="video-list-loader" role="status" aria-label="Searching videos">
          <span class="video-list-spinner" aria-hidden="true"></span>
        </div>
      </div>

      <nav v-if="displayedVideos.length > 0 && videosCount > pageSize" class="pagination" aria-label="Videos pages">
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
    </article>
  </section>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import UserAvatar from '../components/UserAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  videos: { type: Array, default: () => [] },
  videosCount: { type: Number, default: 0 },
  isAuthenticated: { type: Boolean, default: false },
  isLoadingVideos: { type: Boolean, default: false },
  formatBytes: { type: Function, default: null },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  avatarUrl: { type: Function, required: true },
});

const emit = defineEmits(['delete-video', 'load-videos']);
const pageSize = 30;
const searchQuery = ref('');
const currentPage = ref(1);
const displayedVideos = ref([...props.videos]);
let searchTimerId = null;
let skipNextSearchWatch = false;

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
  if (skipNextSearchWatch) {
    skipNextSearchWatch = false;
    return;
  }

  clearPendingSearchTimer();

  searchTimerId = window.setTimeout(() => {
    searchVideos();
  }, 300);
});

onUnmounted(() => {
  clearPendingSearchTimer();
});

function clearPendingSearchTimer() {
  if (searchTimerId) {
    clearTimeout(searchTimerId);
    searchTimerId = null;
  }
}

function searchVideos() {
  clearPendingSearchTimer();
  loadVideos(1);
}

function loadVideos(page = currentPage.value) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
  emit('load-videos', {
    search: searchQuery.value.trim(),
    offset: (currentPage.value - 1) * pageSize,
    limit: pageSize,
  });
}

function goToPage(page) {
  loadVideos(page);
}

function clearSearch() {
  clearPendingSearchTimer();
  skipNextSearchWatch = true;
  searchQuery.value = '';
  searchVideos();
}

function canDelete(video) {
  return Boolean(props.currentUser?.is_admin || (props.currentUser?.id && props.currentUser.id === video.author_id));
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

function videoTileStyle(video) {
  if (!video.has_thumbnail) {
    return {};
  }

  return {
    backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")`,
  };
}
</script>
