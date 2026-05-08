<template>
  <section class="library-grid">
    <article class="panel">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">{{ channel?.name || 'Channel' }}</p>
          <h2>{{ isEditMode ? 'Edit playlist' : 'Create playlist' }}</h2>
        </div>
        <button v-if="isEditMode" class="danger-button" type="button" :disabled="isDeleting" @click="removePlaylist">
          {{ isDeleting ? 'Deleting...' : 'Delete playlist' }}
        </button>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Title</span>
          <input v-model.trim="form.title" type="text" required />
        </label>
        <label>
          <span>Description</span>
          <textarea v-model.trim="form.description" rows="4"></textarea>
        </label>
        <fieldset class="channel-video-picker">
          <legend>Playlist videos</legend>
          <div v-if="channelVideos.length === 0" class="empty-state">Upload videos to this channel first.</div>
          <label v-for="item in channelVideos" :key="item.id" class="channel-video-option">
            <input v-model="selectedVideoIds" type="checkbox" :value="item.video_id" />
            <span>{{ item.video?.title || item.video?.original_filename || item.video_id }}</span>
          </label>
        </fieldset>
        <button class="primary-button" type="submit" :disabled="isSaving || !form.title">
          {{ isSaving ? 'Saving...' : 'Save playlist' }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  loadChannel: { type: Function, required: true },
  loadChannelVideos: { type: Function, required: true },
  loadChannelPlaylist: { type: Function, required: true },
  createChannelPlaylist: { type: Function, required: true },
  changeChannelPlaylist: { type: Function, required: true },
  deleteChannelPlaylist: { type: Function, required: true },
  addVideoToChannelPlaylist: { type: Function, required: true },
  removeVideoFromChannelPlaylist: { type: Function, required: true },
});

const route = useRoute();
const router = useRouter();
const channelId = computed(() => route.params.channelId);
const isEditMode = computed(() => Boolean(route.params.playlistId));
const channel = ref(null);
const playlist = ref(null);
const channelVideos = ref([]);
const selectedVideoIds = ref([]);
const isSaving = ref(false);
const isDeleting = ref(false);
const form = reactive({ title: '', description: '' });

async function loadPage() {
  channel.value = await props.loadChannel(channelId.value);
  const videosResponse = await props.loadChannelVideos(channelId.value);
  channelVideos.value = videosResponse.videos || [];
  if (isEditMode.value) {
    playlist.value = await props.loadChannelPlaylist(channelId.value, route.params.playlistId);
    form.title = playlist.value.title || '';
    form.description = playlist.value.description || '';
    selectedVideoIds.value = (playlist.value.items || []).map((item) => item.video_id);
  }
}

async function submit() {
  isSaving.value = true;
  try {
    const saved = isEditMode.value
      ? await props.changeChannelPlaylist(channelId.value, route.params.playlistId, {
        title: form.title,
        description: form.description || null,
      })
      : await props.createChannelPlaylist(channelId.value, {
        title: form.title,
        description: form.description || null,
      });
    const oldIds = new Set((playlist.value?.items || []).map((item) => item.video_id));
    const nextIds = new Set(selectedVideoIds.value);
    await Promise.all([...oldIds].filter((videoId) => !nextIds.has(videoId)).map((videoId) => (
      props.removeVideoFromChannelPlaylist(channelId.value, saved.id, videoId)
    )));
    await Promise.all([...nextIds].filter((videoId) => !oldIds.has(videoId)).map((videoId) => (
      props.addVideoToChannelPlaylist(channelId.value, saved.id, videoId)
    )));
    await router.push(`/channels/${channelId.value}/playlists`);
  } finally {
    isSaving.value = false;
  }
}

async function removePlaylist() {
  isDeleting.value = true;
  try {
    await props.deleteChannelPlaylist(channelId.value, route.params.playlistId);
    await router.push(`/channels/${channelId.value}/playlists`);
  } finally {
    isDeleting.value = false;
  }
}

onMounted(loadPage);
</script>
