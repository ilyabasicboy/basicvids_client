<template>
  <section class="library-grid">
    <article class="panel channel-hero-panel">
      <div v-if="isLoading" class="empty-state">Loading channel...</div>
      <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
      <template v-else-if="channel">
        <div class="channel-hero">
          <ChannelAvatar
            class="channel-hero-mark"
            :channel-id="channel.id"
            :label="channel.name"
            :channel-avatar-url="channelAvatarUrl"
          />
          <div>
            <p class="eyebrow">Channel</p>
            <h2>{{ channel.name }}</h2>
            <small>@{{ channel.slug }}</small>
            <p>{{ channel.description || 'No description.' }}</p>
            <small>{{ channel.videos_count }} videos · {{ channel.playlists_count }} playlists · {{ channel.subscribers_count }} subscribers</small>
          </div>
        </div>
        <div class="form-actions">
          <RouterLink class="ghost-link" :to="`/channels/${channel.id}/playlists`">Playlists</RouterLink>
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channel.id}/upload`">Upload video</RouterLink>
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channel.id}/edit`">Edit channel</RouterLink>
          <button v-if="isAuthenticated && !canManage" type="button" class="primary-button" @click="toggleSubscription">
            {{ channel.is_subscribed ? 'Unsubscribe' : 'Subscribe' }}
          </button>
        </div>
      </template>
    </article>

    <article v-if="channel" class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">{{ channel.name }}</p>
          <h2>Videos</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channel.id}/upload`">Upload video</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh channel videos" @click="loadChannelVideoItems">↻</button>
        </div>
      </div>

      <form class="video-search-form" role="search" @submit.prevent="searchVideos">
        <label for="channel-video-search">Search videos</label>
        <div class="video-search-row">
          <div class="search-input-wrap">
            <input
              id="channel-video-search"
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

      <button v-if="appliedSearch" type="button" class="ghost-button clear-filter-button" @click="clearSearchFilter">
        Clear
      </button>

      <div v-if="isLoadingVideos" class="empty-state">Loading videos...</div>
      <div v-else-if="visibleItems.length === 0" class="empty-state">
        {{ appliedSearch ? 'No channel videos match your search.' : 'No videos on this channel yet.' }}
      </div>
      <ul v-else class="video-list">
        <li v-for="item in visibleItems" :key="item.id" class="video-item">
          <article class="video-card">
            <RouterLink v-if="item.video" class="video-card-link" :to="`/videos/${item.video_id}`">
              <div class="video-tile" :class="{ fallback: !item.video.has_thumbnail }" :style="videoTileStyle(item.video)">
                <div v-if="!item.video.has_thumbnail" class="video-tile-initial">{{ getInitial(item.video.title || item.video.original_filename) }}</div>
              </div>
              <div class="video-card-meta">
                <strong class="video-card-title">{{ item.video.title || item.video.original_filename }}</strong>
                <small class="video-card-age">{{ formatDate(item.created_at) }}</small>
              </div>
            </RouterLink>
            <div v-else class="empty-state">Video unavailable</div>
            <button
              v-if="item.video"
              type="button"
              class="favorite-star-button"
              :class="{ active: item.video.is_favorite }"
              :disabled="favoriteVideoIds.has(item.video_id)"
              :aria-label="favoriteVideoLabel(item.video)"
              @click="toggleVideoFavorite(item.video)"
            >
              ★
            </button>
            <button v-if="canManage" class="video-tile-delete" type="button" @click="removeVideo(item.video_id)">X</button>
          </article>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import ChannelAvatar from '../components/ChannelAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isAuthenticated: { type: Boolean, default: false },
  loadChannel: { type: Function, required: true },
  loadChannelVideos: { type: Function, required: true },
  removeVideoFromChannel: { type: Function, required: true },
  subscribeToChannel: { type: Function, required: true },
  unsubscribeFromChannel: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  channelAvatarUrl: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  toggleFavoriteVideo: { type: Function, required: true },
});

const route = useRoute();
const channel = ref(null);
const items = ref([]);
const searchQuery = ref('');
const appliedSearch = ref('');
const isLoading = ref(false);
const isLoadingVideos = ref(false);
const errorMessage = ref('');
const favoriteVideoIds = ref(new Set());
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));
const visibleItems = computed(() => {
  const query = appliedSearch.value.trim().toLowerCase();
  if (!query) {
    return items.value;
  }

  return items.value.filter((item) => {
    const video = item.video;
    if (!video) {
      return false;
    }
    return [
      video.title,
      video.description,
      video.original_filename,
    ].some((value) => (value || '').toLowerCase().includes(query));
  });
});

async function loadCurrentChannel() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    channel.value = await props.loadChannel(route.params.channelId);
    await loadChannelVideoItems();
  } catch (error) {
    errorMessage.value = error.message || 'Channel not found.';
  } finally {
    isLoading.value = false;
  }
}

async function loadChannelVideoItems() {
  if (!channel.value) {
    items.value = [];
    return;
  }

  isLoadingVideos.value = true;
  try {
    const response = await props.loadChannelVideos(channel.value.id);
    items.value = response.videos || [];
  } finally {
    isLoadingVideos.value = false;
  }
}

async function removeVideo(videoId) {
  await props.removeVideoFromChannel(channel.value.id, videoId);
  await loadChannelVideoItems();
}

async function toggleSubscription() {
  if (channel.value.is_subscribed) {
    await props.unsubscribeFromChannel(channel.value.id);
  } else {
    await props.subscribeToChannel(channel.value.id);
  }
  await loadCurrentChannel();
}

async function toggleVideoFavorite(video) {
  if (favoriteVideoIds.value.has(video.id)) {
    return;
  }

  favoriteVideoIds.value = new Set([...favoriteVideoIds.value, video.id]);
  try {
    const nextValue = await props.toggleFavoriteVideo(video);
    video.is_favorite = nextValue;
  } finally {
    const nextIds = new Set(favoriteVideoIds.value);
    nextIds.delete(video.id);
    favoriteVideoIds.value = nextIds;
  }
}

function favoriteVideoLabel(video) {
  const title = video.title || video.original_filename;
  return video.is_favorite ? `Remove ${title} from favorites` : `Save ${title}`;
}

function searchVideos() {
  appliedSearch.value = searchQuery.value.trim();
}

function clearSearch() {
  searchQuery.value = '';
}

function clearSearchFilter() {
  searchQuery.value = '';
  appliedSearch.value = '';
}

function videoTileStyle(video) {
  return video?.has_thumbnail ? { backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")` } : {};
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '';
}

onMounted(loadCurrentChannel);
</script>
