<template>
  <section class="main-grid">
    <article class="panel upload-panel">
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
          <a :href="videoUrl(video.id)" target="_blank" rel="noreferrer">Open</a>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup>
defineProps({
  videos: { type: Array, default: () => [] },
  isLoadingVideos: { type: Boolean, default: false },
  uploadFile: { type: Object, default: null },
  isUploading: { type: Boolean, default: false },
  formatBytes: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  videoUrl: { type: Function, required: true },
});

defineEmits(['drop-video', 'load-videos', 'select-video', 'upload-video']);
</script>
