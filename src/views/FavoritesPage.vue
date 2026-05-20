<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Saved</p>
          <h2>Favorites</h2>
        </div>
        <button type="button" class="ghost-button icon-button" aria-label="Refresh favorites" @click="loadPage">↻</button>
      </div>

      <div v-if="!isAuthenticated" class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to view favorites.</RouterLink>
      </div>
      <div v-else-if="isLoading" class="empty-state">Loading favorites...</div>
      <template v-else>
        <div class="favorites-tabs" role="tablist" aria-label="Favorite content type">
          <button
            type="button"
            class="favorites-tab"
            :class="{ active: activeTab === 'videos' }"
            role="tab"
            :aria-selected="String(activeTab === 'videos')"
            @click="activeTab = 'videos'"
          >
            Videos
            <span>{{ favoriteVideos.length }}</span>
          </button>
          <button
            type="button"
            class="favorites-tab"
            :class="{ active: activeTab === 'playlists' }"
            role="tab"
            :aria-selected="String(activeTab === 'playlists')"
            @click="activeTab = 'playlists'"
          >
            Playlists
            <span>{{ favoritePlaylists.length }}</span>
          </button>
        </div>

        <section v-if="activeTab === 'videos'" class="favorites-section" role="tabpanel">
          <div v-if="favoriteVideos.length === 0" class="empty-state">No saved videos yet.</div>
          <ul v-else class="video-list">
            <li v-for="item in favoriteVideos" :key="item.id" class="video-item">
              <article class="video-card">
                <RouterLink v-if="item.video" class="video-card-link" :to="`/videos/${item.video_id}`">
                  <div class="video-tile" :class="{ fallback: !item.video.has_thumbnail }" :style="videoTileStyle(item.video)">
                    <div v-if="!item.video.has_thumbnail" class="video-tile-initial">
                      {{ getInitial(item.video.title || item.video.original_filename) }}
                    </div>
                  </div>
                  <div class="video-card-meta">
                    <strong class="video-card-title">{{ item.video.title || item.video.original_filename }}</strong>
                    <small class="video-card-age">Saved {{ formatDate(item.created_at) }}</small>
                  </div>
                </RouterLink>
                <div v-else class="empty-state">Video unavailable</div>
                <button
                  v-if="item.video"
                  type="button"
                  class="favorite-star-button active"
                  :aria-label="`Remove ${item.video.title || item.video.original_filename} from favorites`"
                  @click="removeFavoriteVideo(item)"
                >
                  ★
                </button>
              </article>
            </li>
          </ul>
        </section>

        <section v-else class="favorites-section" role="tabpanel">
          <div v-if="favoritePlaylists.length === 0" class="empty-state">No saved playlists yet.</div>
          <ul v-else class="channel-grid">
            <li v-for="item in favoritePlaylists" :key="item.id" class="channel-card">
              <RouterLink
                v-if="item.playlist"
                class="channel-card-link"
                :to="`/channels/${item.channel_id}/playlists/${item.playlist_id}`"
              >
                <div class="channel-card-mark">PL</div>
                <div class="channel-card-body">
                  <strong>{{ item.playlist.title }}</strong>
                  <small>{{ item.playlist.videos_count }} videos</small>
                  <p>{{ item.playlist.description || 'No description.' }}</p>
                </div>
              </RouterLink>
              <div v-else class="empty-state">Playlist unavailable</div>
              <button
                v-if="item.playlist"
                type="button"
                class="favorite-star-button active"
                :aria-label="`Remove ${item.playlist.title} from favorites`"
                @click="removeFavoritePlaylist(item)"
              >
                ★
              </button>
            </li>
          </ul>
        </section>
      </template>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  isAuthenticated: { type: Boolean, default: false },
  loadFavoriteVideos: { type: Function, required: true },
  loadFavoritePlaylists: { type: Function, required: true },
  toggleFavoriteVideo: { type: Function, required: true },
  toggleFavoritePlaylist: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
});

const isLoading = ref(false);
const activeTab = ref('videos');
const favoriteVideos = ref([]);
const favoritePlaylists = ref([]);

async function loadPage() {
  if (!props.isAuthenticated) {
    favoriteVideos.value = [];
    favoritePlaylists.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const [videosResponse, playlistsResponse] = await Promise.all([
      props.loadFavoriteVideos({ limit: 100 }),
      props.loadFavoritePlaylists({ limit: 100 }),
    ]);
    favoriteVideos.value = videosResponse.items || [];
    favoritePlaylists.value = playlistsResponse.items || [];
  } finally {
    isLoading.value = false;
  }
}

async function removeFavoriteVideo(item) {
  if (!item.video) {
    return;
  }

  await props.toggleFavoriteVideo({ ...item.video, is_favorite: true });
  favoriteVideos.value = favoriteVideos.value.filter((favorite) => favorite.id !== item.id);
}

async function removeFavoritePlaylist(item) {
  if (!item.playlist) {
    return;
  }

  await props.toggleFavoritePlaylist({ ...item.playlist, is_favorite: true }, item.channel_id);
  favoritePlaylists.value = favoritePlaylists.value.filter((favorite) => favorite.id !== item.id);
}

function videoTileStyle(video) {
  return video?.has_thumbnail ? { backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")` } : {};
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '';
}

onMounted(loadPage);
</script>
