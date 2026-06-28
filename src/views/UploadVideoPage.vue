<template>
  <section class="auth-page-grid upload-page">
    <article v-if="isAuthenticated" class="panel upload-panel">
      <div class="panel-heading">
        <p class="eyebrow">{{ headingEyebrow }}</p>
        <h2>{{ headingTitle }}</h2>
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
        <label>
          <span>Category</span>
          <select v-model="form.categoryId">
            <option value="">No category</option>
            <option v-for="option in categoryOptions" :key="option.id" :value="String(option.id)">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label
          class="dropzone"
          :class="{ selected: form.file }"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <input type="file" :accept="videoAccept" @change="onFileSelect" />
          <span>{{ form.file ? form.file.name : 'Choose or drop a video file' }}</span>
          <small>{{ form.file ? formatBytes(form.file.size) : `Supported formats: ${supportedVideoFormatsLabel}` }}</small>
        </label>

        <label class="dropzone thumbnail-dropzone" :class="{ selected: form.thumbnail }">
          <input type="file" accept="image/*" @change="onThumbnailSelect" />
          <span>{{ form.thumbnail ? form.thumbnail.name : 'Choose a thumbnail image' }}</span>
          <small>{{ form.thumbnail ? formatBytes(form.thumbnail.size) : 'Shown in the video library' }}</small>
        </label>

        <button class="primary-button" type="submit" :disabled="!form.file || !form.title || isUploading">
          {{ isUploading ? 'Uploading...' : 'Upload video' }}
        </button>

        <div v-if="isUploading || uploadProgress > 0" class="upload-progress-card">
          <div class="upload-progress-head">
            <strong>{{ uploadStatus }}</strong>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="upload-progress-bar" aria-hidden="true">
            <span :style="{ width: `${uploadProgress}%` }"></span>
          </div>
          <small>{{ uploadProgressText }}</small>
        </div>
      </form>
    </article>

    <article v-else class="panel upload-panel">
      <div class="panel-heading">
        <p class="eyebrow">{{ headingEyebrow }}</p>
        <h2>{{ headingTitle }}</h2>
      </div>
      <div class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to upload videos.</RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  categories: { type: Array, default: () => [] },
  isAuthenticated: { type: Boolean, default: false },
  isUploading: { type: Boolean, default: false },
  formatBytes: { type: Function, required: true },
  uploadProgress: { type: Number, default: 0 },
  uploadProgressText: { type: String, default: '' },
  uploadStatus: { type: String, default: '' },
  headingEyebrow: { type: String, default: 'Storage' },
  headingTitle: { type: String, default: 'Upload video' },
});

const emit = defineEmits(['upload-video']);
const categoryOptions = computed(() => flattenCategories(props.categories));
const supportedVideoFormats = ['.mp4', '.m4v', '.mov', '.avi', '.wmv', '.mkv', '.webm', '.mpeg', '.mpg', '.ts', '.m2ts', '.mts', '.3gp', '.flv', '.ogv'];
const videoAccept = supportedVideoFormats.join(',');
const supportedVideoFormatsLabel = supportedVideoFormats.join(', ');

const form = reactive({
  title: '',
  description: '',
  categoryId: '',
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
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    thumbnail: form.thumbnail,
  });
}

function flattenCategories(categories, level = 0) {
  return categories.flatMap((category) => [
    {
      id: category.id,
      label: `${'— '.repeat(level)}${category.name}`,
    },
    ...flattenCategories(category.children || [], level + 1),
  ]);
}
</script>
