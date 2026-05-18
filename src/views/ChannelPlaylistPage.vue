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
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
});

const route = useRoute();
const channelId = computed(() => route.params.channelId);
const playlistId = computed(() => route.params.playlistId);
const channel = ref(null);
const playlist = ref(null);
const isLoading = ref(false);
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));
const items = computed(() => [...(playlist.value?.items || [])].sort((left, right) => left.position - right.position));

async function loadPage() {
  isLoading.value = true;
  try {
    channel.value = await props.loadChannel(channelId.value);
    playlist.value = await props.loadChannelPlaylist(channelId.value, playlistId.value);
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

onMounted(loadPage);
</script>
