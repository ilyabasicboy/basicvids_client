<template>
  <section class="auth-page-grid upload-page">
    <article v-if="isAuthenticated" class="panel upload-panel">
      <div class="panel-heading">
        <p class="eyebrow">Storage</p>
        <h2>Upload video</h2>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Title</span>
          <input v-model.trim="form.title" type="text" required />
        </label>
        <label>
          <span>Description</span>
          <textarea v-model.trim="form.description" rows="5"></textarea>
        </label>

        <label
          class="dropzone"
          :class="{ selected: form.file }"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <input type="file" accept="video/*" @change="onFileSelect" />
          <span>{{ form.file ? form.file.name : 'Choose or drop a video file' }}</span>
          <small>{{ form.file ? formatBytes(form.file.size) : 'Stored by the storage microservice' }}</small>
        </label>

        <label class="dropzone thumbnail-dropzone" :class="{ selected: form.thumbnail }">
          <input type="file" accept="image/*" @change="onThumbnailSelect" />
          <span>{{ form.thumbnail ? form.thumbnail.name : 'Choose a thumbnail image' }}</span>
          <small>{{ form.thumbnail ? formatBytes(form.thumbnail.size) : 'Shown in the video library' }}</small>
        </label>

        <button class="primary-button" type="submit" :disabled="!form.file || !form.title || isUploading">
          {{ isUploading ? 'Uploading...' : 'Upload video' }}
        </button>
      </form>
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
  </section>
</template>

<script setup>
import { reactive } from 'vue';
import { RouterLink } from 'vue-router';

defineProps({
  isAuthenticated: { type: Boolean, default: false },
  isUploading: { type: Boolean, default: false },
  formatBytes: { type: Function, required: true },
});

const emit = defineEmits(['upload-video']);

const form = reactive({
  title: '',
  description: '',
  file: null,
  thumbnail: null,
});

function onFileSelect(event) {
  form.file = event.target.files?.[0] || null;
  if (form.file && !form.title) {
    form.title = form.file.name;
  }
}

function onDrop(event) {
  form.file = event.dataTransfer.files?.[0] || null;
  if (form.file && !form.title) {
    form.title = form.file.name;
  }
}

function onThumbnailSelect(event) {
  form.thumbnail = event.target.files?.[0] || null;
}

function submit() {
  emit('upload-video', {
    file: form.file,
    title: form.title,
    description: form.description,
    thumbnail: form.thumbnail,
  });
}
</script>
