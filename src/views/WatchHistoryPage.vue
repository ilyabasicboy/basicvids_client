<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <h2>Watch history</h2>
        </div>
        <div class="form-actions">
          <button
            v-if="historyItems.length > 0"
            type="button"
            class="ghost-button"
            :disabled="isClearingHistory"
            @click="clearHistory"
          >
            {{ isClearingHistory ? 'Clearing...' : 'Clear history' }}
          </button>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh history" @click="loadHistory()">
            ↻
          </button>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to view your history.</RouterLink>
      </div>
      <template v-else>
        <div v-if="isLoading" class="empty-state">Loading history...</div>
        <div v-else-if="historyItems.length === 0" class="empty-state">No watch history yet.</div>
        <ul v-else class="history-list">
          <li v-for="item in historyItems" :key="item.id" class="history-item">
            <RouterLink v-if="item.video" class="history-card-link" :to="`/videos/${item.video_id}`">
              <div
                class="history-tile"
                :class="{ fallback: !item.video.has_thumbnail }"
                :style="videoTileStyle(item.video)"
              >
                <div v-if="!item.video.has_thumbnail" class="video-tile-initial">{{ getInitial(item.video.title || item.video.original_filename) }}</div>
                <small v-if="item.last_position_seconds && item.duration_seconds" class="history-progress-badge">
                  {{ formatProgress(item.last_position_seconds, item.duration_seconds) }}
                </small>
              </div>
              <div class="history-meta">
                <strong class="video-card-title">{{ item.video.title || item.video.original_filename }}</strong>
                <small class="history-line">
                  <span>{{ item.completed ? 'Completed' : 'In progress' }}</span>
                  <span>{{ item.view_count }} views</span>
                </small>
                <small class="history-line">
                  <span>Last watched {{ formatDate(item.last_viewed_at) }}</span>
                </small>
              </div>
            </RouterLink>
            <div v-else class="history-card-link">
              <div class="history-tile fallback">
                <div class="video-tile-initial">V</div>
              </div>
              <div class="history-meta">
                <strong class="video-card-title">Video unavailable</strong>
                <small class="history-line">
                  <span>Last watched {{ formatDate(item.last_viewed_at) }}</span>
                </small>
              </div>
            </div>
            <button
              type="button"
              class="history-remove-button"
              :disabled="pendingRemovalId === item.video_id"
              @click="removeItem(item.video_id)"
            >
              {{ pendingRemovalId === item.video_id ? 'Removing...' : 'Remove' }}
            </button>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isAuthenticated: { type: Boolean, default: false },
  loadWatchHistory: { type: Function, required: true },
  deleteVideoHistory: { type: Function, required: true },
  clearWatchHistory: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
});

const historyItems = ref([]);
const isLoading = ref(false);
const isClearingHistory = ref(false);
const pendingRemovalId = ref('');

async function loadHistory() {
  if (!props.isAuthenticated) {
    historyItems.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const response = await props.loadWatchHistory({ limit: 100 });
    historyItems.value = response.items || [];
  } finally {
    isLoading.value = false;
  }
}

async function removeItem(videoId) {
  pendingRemovalId.value = videoId;
  try {
    await props.deleteVideoHistory(videoId);
    historyItems.value = historyItems.value.filter((item) => item.video_id !== videoId);
  } finally {
    pendingRemovalId.value = '';
  }
}

async function clearHistory() {
  isClearingHistory.value = true;
  try {
    await props.clearWatchHistory();
    historyItems.value = [];
  } finally {
    isClearingHistory.value = false;
  }
}

function videoTileStyle(video) {
  return video?.has_thumbnail
    ? { backgroundImage: `linear-gradient(180deg, rgba(7, 10, 13, 0.08) 0%, rgba(7, 10, 13, 0.72) 100%), url(${props.videoThumbnailUrl(video.id)})` }
    : {};
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '';
}

function formatProgress(position, duration) {
  const ratio = duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;
  return `${ratio}% watched`;
}

onMounted(loadHistory);
watch(() => props.currentUser?.id, loadHistory);
</script>
