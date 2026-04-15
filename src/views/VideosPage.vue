<template>
  <section class="main-grid">
    <article v-if="isAuthenticated" class="panel upload-panel">
      <div class="panel-heading">
        <p class="eyebrow">Storage</p>
        <h2>Upload video</h2>
      </div>

      <label
        class="dropzone"
        :class="{ selected: uploadFile }"
        @dragover.prevent
        @drop.prevent="$emit('drop-video', $event)"
      >
        <input type="file" accept="video/*" @change="$emit('select-video', $event)" />
        <span>{{ uploadFile ? uploadFile.name : 'Choose or drop a video file' }}</span>
        <small>{{ uploadFile ? formatBytes(uploadFile.size) : 'Stored by the storage microservice' }}</small>
      </label>

      <button class="primary-button" type="button" :disabled="!uploadFile || isUploading" @click="$emit('upload-video')">
        {{ isUploading ? 'Uploading...' : 'Upload video' }}
      </button>
    </article>

    <article v-else class="panel upload-panel">
      <div class="panel-heading">
        <p class="eyebrow">Storage</p>
        <h2>Upload video</h2>
      </div>
      <div class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to upload videos.</RouterLink>
      </div>
    </article>

    <article class="panel library-panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Videos</p>
          <h2>Library</h2>
        </div>
        <button type="button" class="ghost-button" @click="$emit('load-videos')">Refresh</button>
      </div>

      <div v-if="isLoadingVideos" class="empty-state">Loading videos...</div>
      <div v-else-if="videos.length === 0" class="empty-state">No videos uploaded yet.</div>
      <ul v-else class="video-list">
        <li v-for="video in videos" :key="video.id" class="video-item">
          <div class="video-thumb">
            <span>{{ getInitial(video.original_filename) }}</span>
          </div>
          <div>
            <strong>{{ video.original_filename }}</strong>
            <small>{{ formatBytes(video.size_bytes) }} · {{ video.content_type || 'video' }}</small>
          </div>
          <RouterLink :to="`/videos/${video.id}`">Open</RouterLink>
          <button v-if="canDelete(video)" class="danger-button" type="button" @click="$emit('delete-video', video)">
            Delete
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
  uploadFile: { type: Object, default: null },
  isUploading: { type: Boolean, default: false },
  formatBytes: { type: Function, required: true },
  getInitial: { type: Function, required: true },
});

defineEmits(['delete-video', 'drop-video', 'load-videos', 'select-video', 'upload-video']);

function canDelete(video) {
  return Boolean(props.currentUser?.is_admin || (props.currentUser?.id && props.currentUser.id === video.author_id));
}
</script>
