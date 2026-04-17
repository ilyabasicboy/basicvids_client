<template>
  <section class="library-grid">
    <article class="panel library-panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Videos</p>
          <h2>Library</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="isAuthenticated" class="ghost-link" to="/videos/upload">Upload video</RouterLink>
          <RouterLink v-else class="ghost-link" to="/auth">Sign in to upload</RouterLink>
          <button type="button" class="ghost-button" @click="$emit('load-videos')">Refresh</button>
        </div>
      </div>

      <div v-if="isLoadingVideos" class="empty-state">Loading videos...</div>
      <div v-else-if="videos.length === 0" class="empty-state">No videos uploaded yet.</div>
      <ul v-else class="video-list">
        <li v-for="video in videos" :key="video.id" class="video-item">
          <RouterLink
            class="video-tile"
            :class="{ fallback: !video.has_thumbnail }"
            :style="videoTileStyle(video)"
            :to="`/videos/${video.id}`"
          >
            <div v-if="!video.has_thumbnail" class="video-tile-initial">{{ getInitial(video.title || video.original_filename) }}</div>
            <div class="video-tile-content">
              <strong>{{ video.title || video.original_filename }}</strong>
              <small>{{ authorLabel(video) }}</small>
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
    </article>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  videos: { type: Array, default: () => [] },
  isAuthenticated: { type: Boolean, default: false },
  isLoadingVideos: { type: Boolean, default: false },
  formatBytes: { type: Function, default: null },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
});

defineEmits(['delete-video', 'load-videos']);

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

function videoTileStyle(video) {
  if (!video.has_thumbnail) {
    return {};
  }

  return {
    backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")`,
  };
}
</script>
