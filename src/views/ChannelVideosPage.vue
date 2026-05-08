<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">{{ channel?.name || 'Channel' }}</p>
          <h2>Videos</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channelId}/upload`">Upload video</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh channel videos" @click="loadPage">↻</button>
        </div>
      </div>
      <div v-if="isLoading" class="empty-state">Loading videos...</div>
      <div v-else-if="items.length === 0" class="empty-state">No videos on this channel yet.</div>
      <ul v-else class="video-list">
        <li v-for="item in items" :key="item.id" class="video-item">
          <article class="video-card">
            <RouterLink v-if="item.video" class="video-card-link" :to="`/videos/${item.video_id}`">
              <div class="video-tile" :class="{ fallback: !item.video.has_thumbnail }" :style="videoTileStyle(item.video)">
                <div v-if="!item.video.has_thumbnail" class="video-tile-initial">{{ getInitial(item.video.title || item.video.original_filename) }}</div>
              </div>
              <div class="video-card-meta">
                <strong class="video-card-title">{{ item.video.title || item.video.original_filename }}</strong>
                <small>{{ formatDate(item.created_at) }}</small>
              </div>
            </RouterLink>
            <div v-else class="empty-state">Video unavailable</div>
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

const props = defineProps({
  currentUser: { type: Object, default: null },
  loadChannel: { type: Function, required: true },
  loadChannelVideos: { type: Function, required: true },
  removeVideoFromChannel: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
});

const route = useRoute();
const channelId = computed(() => route.params.channelId);
const channel = ref(null);
const items = ref([]);
const isLoading = ref(false);
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));

async function loadPage() {
  isLoading.value = true;
  try {
    channel.value = await props.loadChannel(channelId.value);
    const response = await props.loadChannelVideos(channelId.value);
    items.value = response.videos || [];
  } finally {
    isLoading.value = false;
  }
}

async function removeVideo(videoId) {
  await props.removeVideoFromChannel(channelId.value, videoId);
  await loadPage();
}

function videoTileStyle(video) {
  return video?.has_thumbnail ? { backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")` } : {};
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '';
}

onMounted(loadPage);
</script>
