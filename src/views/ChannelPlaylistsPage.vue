<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">{{ channel?.name || 'Channel' }}</p>
          <h2>Playlists</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channelId}/playlists/create`">Create playlist</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh playlists" @click="loadPage">↻</button>
        </div>
      </div>
      <div v-if="isLoading" class="empty-state">Loading playlists...</div>
      <div v-else-if="playlists.length === 0" class="empty-state">No playlists yet.</div>
      <ul v-else class="channel-grid">
        <li v-for="playlist in playlists" :key="playlist.id" class="channel-card">
          <RouterLink class="channel-card-link" :to="`/channels/${channelId}/playlists/${playlist.id}`">
            <div class="channel-card-mark">PL</div>
            <div class="channel-card-body">
              <strong>{{ playlist.title }}</strong>
              <small>{{ playlist.videos_count }} videos</small>
              <p>{{ playlist.description || 'No description.' }}</p>
            </div>
          </RouterLink>
          <button
            type="button"
            class="favorite-star-button"
            :class="{ active: playlist.is_favorite }"
            :disabled="favoritePlaylistIds.has(playlist.id)"
            :aria-label="favoritePlaylistLabel(playlist)"
            @click="togglePlaylistFavorite(playlist)"
          >
            ★
          </button>
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
  isAuthenticated: { type: Boolean, default: false },
  loadChannel: { type: Function, required: true },
  loadChannelPlaylists: { type: Function, required: true },
  loadFavoritePlaylistStatuses: { type: Function, required: true },
  toggleFavoritePlaylist: { type: Function, required: true },
});

const route = useRoute();
const channelId = computed(() => route.params.channelId);
const channel = ref(null);
const playlists = ref([]);
const isLoading = ref(false);
const favoritePlaylistIds = ref(new Set());
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));

async function loadPage() {
  isLoading.value = true;
  try {
    channel.value = await props.loadChannel(channelId.value);
    const response = await props.loadChannelPlaylists(channelId.value);
    const playlistItems = response.playlists || [];
    const favoriteStatuses = await props.loadFavoritePlaylistStatuses(playlistItems.map((playlist) => playlist.id));
    playlists.value = playlistItems.map((playlist) => ({
      ...playlist,
      is_favorite: Boolean(favoriteStatuses[playlist.id]),
    }));
  } finally {
    isLoading.value = false;
  }
}

async function togglePlaylistFavorite(playlist) {
  if (favoritePlaylistIds.value.has(playlist.id)) {
    return;
  }

  favoritePlaylistIds.value = new Set([...favoritePlaylistIds.value, playlist.id]);
  try {
    const nextValue = await props.toggleFavoritePlaylist(playlist, channelId.value);
    playlist.is_favorite = nextValue;
  } finally {
    const nextIds = new Set(favoritePlaylistIds.value);
    nextIds.delete(playlist.id);
    favoritePlaylistIds.value = nextIds;
  }
}

function favoritePlaylistLabel(playlist) {
  return playlist.is_favorite ? `Remove ${playlist.title} from favorites` : `Save ${playlist.title}`;
}

onMounted(loadPage);
</script>
