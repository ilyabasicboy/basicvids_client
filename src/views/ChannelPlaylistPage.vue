<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">{{ channel?.name || 'Channel' }}</p>
          <h2>{{ playlist?.title || 'Playlist' }}</h2>
          <p v-if="playlist?.description" class="panel-subcopy">{{ playlist.description }}</p>
        </div>
        <div class="form-actions">
          <button
            v-if="playlist"
            type="button"
            class="ghost-button playlist-save-button"
            :class="{ active: playlist.is_favorite }"
            :disabled="isUpdatingPlaylistFavorite"
            @click="togglePlaylistFavorite"
          >
            <span aria-hidden="true">★</span>
            <span>{{ playlist.is_favorite ? 'Saved' : 'Save playlist' }}</span>
          </button>
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channelId}/playlists/${playlistId}/edit`">Edit Playlist</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh playlist" @click="loadPage">↻</button>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state">Loading playlist...</div>
      <div v-else-if="items.length === 0" class="empty-state">No videos in this playlist yet.</div>
      <ul v-else class="video-list">
        <li v-for="item in items" :key="item.id" class="video-item">
          <article class="video-card">
            <RouterLink v-if="item.video" class="video-card-link" :to="playlistVideoRoute(item.video_id)">
              <div class="video-tile" :class="{ fallback: !item.video.has_thumbnail }" :style="videoTileStyle(item.video)">
                <div v-if="!item.video.has_thumbnail" class="video-tile-initial">
                  {{ getInitial(item.video.title || item.video.original_filename) }}
                </div>
              </div>
              <div class="video-card-meta">
                <strong class="video-card-title">{{ item.video.title || item.video.original_filename }}</strong>
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
          </article>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  loadChannel: { type: Function, required: true },
  loadChannelPlaylist: { type: Function, required: true },
  loadFavoritePlaylistStatuses: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  toggleFavoriteVideo: { type: Function, required: true },
  toggleFavoritePlaylist: { type: Function, required: true },
});

const route = useRoute();
const channelId = computed(() => route.params.channelId);
const playlistId = computed(() => route.params.playlistId);
const channel = ref(null);
const playlist = ref(null);
const isLoading = ref(false);
const isUpdatingPlaylistFavorite = ref(false);
const favoriteVideoIds = ref(new Set());
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));
const items = computed(() => [...(playlist.value?.items || [])].sort((left, right) => left.position - right.position));

async function loadPage() {
  isLoading.value = true;
  try {
    channel.value = await props.loadChannel(channelId.value);
    const [loadedPlaylist, favoriteStatuses] = await Promise.all([
      props.loadChannelPlaylist(channelId.value, playlistId.value),
      props.loadFavoritePlaylistStatuses([playlistId.value]),
    ]);
    playlist.value = {
      ...loadedPlaylist,
      is_favorite: Boolean(favoriteStatuses[playlistId.value]),
    };
  } finally {
    isLoading.value = false;
  }
}

function videoTileStyle(video) {
  return video?.has_thumbnail ? { backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")` } : {};
}

function playlistVideoRoute(videoId) {
  return {
    path: `/videos/${videoId}`,
    query: {
      channelId: channelId.value,
      playlistId: playlistId.value,
    },
  };
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

async function togglePlaylistFavorite() {
  if (!playlist.value || isUpdatingPlaylistFavorite.value) {
    return;
  }

  isUpdatingPlaylistFavorite.value = true;
  try {
    const nextValue = await props.toggleFavoritePlaylist(playlist.value, channelId.value);
    playlist.value = {
      ...playlist.value,
      is_favorite: nextValue,
    };
  } finally {
    isUpdatingPlaylistFavorite.value = false;
  }
}

onMounted(loadPage);
</script>
