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
        <section class="playlist-video-picker" aria-labelledby="playlist-videos-title">
          <div class="playlist-video-picker-head">
            <div>
              <h3 id="playlist-videos-title">Playlist videos</h3>
              <p>Select videos from this channel to include in the playlist.</p>
            </div>
            <strong>{{ selectedVideoIds.length }} selected</strong>
          </div>

          <div v-if="channelVideos.length > 0" class="playlist-video-search" role="search">
            <div class="search-input-wrap">
              <input
                v-model="videoSearchQuery"
                type="search"
                class="search-input"
                placeholder="Search videos by title"
                autocomplete="off"
                @keydown.enter.prevent="searchVideos"
              />
              <button
                v-if="videoSearchQuery"
                type="button"
                class="search-clear-button"
                aria-label="Clear video search"
                @click="clearVideoSearch"
              >
                ×
              </button>
            </div>
            <button type="button" class="ghost-button" @click="searchVideos">Search</button>
          </div>

          <div v-if="channelVideos.length === 0" class="empty-state">Upload videos to this channel first.</div>
          <div v-else-if="filteredChannelVideos.length === 0" class="empty-state">No videos match your search.</div>
          <div v-else class="playlist-video-grid">
            <label
              v-for="item in filteredChannelVideos"
              :key="item.id"
              class="playlist-video-card"
              :class="{ selected: selectedVideoIds.includes(item.video_id) }"
              :draggable="selectedVideoIds.includes(item.video_id)"
              @dragstart="onVideoDragStart(item.video_id)"
              @dragover.prevent
              @drop.prevent="onVideoDrop(item.video_id)"
            >
              <input v-model="selectedVideoIds" type="checkbox" :value="item.video_id" />
              <span
                class="playlist-video-card-tile"
                :class="{ fallback: !item.video?.has_thumbnail }"
                :style="videoTileStyle(item.video)"
              >
                <span v-if="!item.video?.has_thumbnail" class="playlist-video-card-initial">
                  {{ getInitial(item.video?.title || item.video?.original_filename || item.video_id) }}
                </span>
              </span>
              <span class="playlist-video-card-title">
                {{ item.video?.title || item.video?.original_filename || item.video_id }}
              </span>
            </label>
          </div>
        </section>
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
  changeChannelPlaylistVideoPosition: { type: Function, required: true },
  removeVideoFromChannelPlaylist: { type: Function, required: true },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
});

const route = useRoute();
const router = useRouter();
const channelId = computed(() => route.params.channelId);
const isEditMode = computed(() => Boolean(route.params.playlistId));
const channel = ref(null);
const playlist = ref(null);
const channelVideos = ref([]);
const selectedVideoIds = ref([]);
const videoSearchQuery = ref('');
const appliedVideoSearch = ref('');
const draggedVideoId = ref(null);
const isSaving = ref(false);
const isDeleting = ref(false);
const form = reactive({ title: '', description: '' });
const filteredChannelVideos = computed(() => {
  const query = appliedVideoSearch.value.trim().toLowerCase();
  if (!query) {
    return channelVideos.value;
  }

  return channelVideos.value.filter((item) => {
    const video = item.video;
    return [
      video?.title,
      video?.original_filename,
      item.video_id,
    ].some((value) => (value || '').toLowerCase().includes(query));
  });
});

async function loadPage() {
  channel.value = await props.loadChannel(channelId.value);
  const videosResponse = await props.loadChannelVideos(channelId.value);
  channelVideos.value = videosResponse.videos || [];
  if (isEditMode.value) {
    playlist.value = await props.loadChannelPlaylist(channelId.value, route.params.playlistId);
    form.title = playlist.value.title || '';
    form.description = playlist.value.description || '';
    selectedVideoIds.value = (playlist.value.items || []).map((item) => item.video_id);
    sortChannelVideosByPlaylist();
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
    await Promise.all(selectedVideoIds.value.map((videoId, index) => (
      props.changeChannelPlaylistVideoPosition(channelId.value, saved.id, videoId, index)
    )));
    await router.push(`/channels/${channelId.value}/playlists/${saved.id}`);
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

function searchVideos() {
  appliedVideoSearch.value = videoSearchQuery.value.trim();
}

function clearVideoSearch() {
  videoSearchQuery.value = '';
  appliedVideoSearch.value = '';
}

function videoTileStyle(video) {
  return video?.has_thumbnail ? { backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")` } : {};
}

function sortChannelVideosByPlaylist() {
  const positionByVideoId = new Map((playlist.value?.items || []).map((item) => [item.video_id, item.position]));
  channelVideos.value = [...channelVideos.value].sort((left, right) => {
    const leftPosition = positionByVideoId.has(left.video_id) ? positionByVideoId.get(left.video_id) : Number.MAX_SAFE_INTEGER;
    const rightPosition = positionByVideoId.has(right.video_id) ? positionByVideoId.get(right.video_id) : Number.MAX_SAFE_INTEGER;
    return leftPosition - rightPosition;
  });
}

function onVideoDragStart(videoId) {
  draggedVideoId.value = videoId;
}

function onVideoDrop(targetVideoId) {
  const sourceVideoId = draggedVideoId.value;
  draggedVideoId.value = null;
  if (!sourceVideoId || sourceVideoId === targetVideoId) {
    return;
  }

  const sourceIndex = selectedVideoIds.value.indexOf(sourceVideoId);
  const targetIndex = selectedVideoIds.value.indexOf(targetVideoId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }

  const nextIds = [...selectedVideoIds.value];
  const [movedVideoId] = nextIds.splice(sourceIndex, 1);
  nextIds.splice(targetIndex, 0, movedVideoId);
  selectedVideoIds.value = nextIds;

  const order = new Map(nextIds.map((videoId, index) => [videoId, index]));
  channelVideos.value = [...channelVideos.value].sort((left, right) => (
    (order.get(left.video_id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.video_id) ?? Number.MAX_SAFE_INTEGER)
  ));
}

onMounted(loadPage);
</script>
