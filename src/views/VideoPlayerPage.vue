<template>
  <section class="video-player-page">
    <article class="panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Player</p>
          <h2>{{ videoTitle }}</h2>
        </div>
        <RouterLink class="ghost-link" to="/videos">Back to videos</RouterLink>
      </div>

      <div v-if="isLoading" class="empty-state">Loading video...</div>
      <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
      <video v-else-if="video" class="video-player" :src="videoUrl(video.id)" controls preload="metadata">
        Your browser cannot play this video.
      </video>
      <div v-else class="empty-state">Video not found.</div>

      <dl v-if="video" class="detail-list">
        <div>
          <dt>Filename</dt>
          <dd>{{ video.original_filename }}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{{ video.content_type || 'video' }}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{{ formatBytes(video.size_bytes) }}</dd>
        </div>
        <div>
          <dt>Author ID</dt>
          <dd>{{ video.author_id ?? 'Unknown' }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  formatBytes: { type: Function, required: true },
  loadVideo: { type: Function, required: true },
  videoUrl: { type: Function, required: true },
});

const route = useRoute();
const video = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const videoTitle = computed(() => video.value?.original_filename || 'Video');

async function loadCurrentVideo() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    video.value = await props.loadVideo(route.params.videoId);
  } catch (error) {
    video.value = null;
    errorMessage.value = error.message || 'Video not found.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCurrentVideo);
watch(() => route.params.videoId, loadCurrentVideo);
</script>
