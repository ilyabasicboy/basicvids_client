<template>
  <section class="auth-page-grid upload-page">
    <article v-if="isAuthenticated" class="panel upload-panel">
      <div class="panel-heading">
        <p class="eyebrow">Channel video</p>
        <h2>Upload to {{ channel?.name || 'channel' }}</h2>
      </div>
      <UploadVideoPage
        :categories="categories"
        :is-authenticated="isAuthenticated"
        :is-uploading="isUploading"
        :format-bytes="formatBytes"
        :upload-progress="uploadProgress"
        :upload-progress-text="uploadProgressText"
        :upload-status="uploadStatus"
        @upload-video="uploadToChannel"
      />
    </article>
    <article v-else class="panel upload-panel">
      <div class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to upload videos.</RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import UploadVideoPage from './UploadVideoPage.vue';

const props = defineProps({
  categories: { type: Array, default: () => [] },
  isAuthenticated: { type: Boolean, default: false },
  isUploading: { type: Boolean, default: false },
  formatBytes: { type: Function, required: true },
  uploadProgress: { type: Number, default: 0 },
  uploadProgressText: { type: String, default: '' },
  uploadStatus: { type: String, default: '' },
  loadChannel: { type: Function, required: true },
});

const emit = defineEmits(['upload-video']);
const route = useRoute();
const channel = ref(null);

async function loadCurrentChannel() {
  channel.value = await props.loadChannel(route.params.channelId);
}

function uploadToChannel(payload) {
  emit('upload-video', { ...payload, channelId: route.params.channelId });
}

onMounted(loadCurrentChannel);
</script>
