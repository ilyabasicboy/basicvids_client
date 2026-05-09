<template>
  <UploadVideoPage
    :categories="categories"
    :is-authenticated="isAuthenticated"
    :is-uploading="isUploading"
    :format-bytes="formatBytes"
    :upload-progress="uploadProgress"
    :upload-progress-text="uploadProgressText"
    :upload-status="uploadStatus"
    heading-eyebrow="Channel Video"
    :heading-title="`Upload to ${channel?.name || 'channel'}`"
    @upload-video="uploadToChannel"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
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
