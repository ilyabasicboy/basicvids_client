<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">{{ channel?.name || 'Channel' }}</p>
          <h2>Playlists</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channelId}/playlists/create`">Create playlist</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh playlists" @click="loadPage">↻</button>
        </div>
      </div>
      <div v-if="isLoading" class="empty-state">Loading playlists...</div>
      <div v-else-if="playlists.length === 0" class="empty-state">No playlists yet.</div>
      <ul v-else class="channel-grid">
        <li v-for="playlist in playlists" :key="playlist.id" class="channel-card">
          <RouterLink class="channel-card-link" :to="`/channels/${channelId}/playlists/${playlist.id}`">
            <div class="channel-card-mark">PL</div>
            <div class="channel-card-body">
              <strong>{{ playlist.title }}</strong>
              <small>{{ playlist.videos_count }} videos</small>
              <p>{{ playlist.description || 'No description.' }}</p>
            </div>
          </RouterLink>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  loadChannel: { type: Function, required: true },
  loadChannelPlaylists: { type: Function, required: true },
});

const route = useRoute();
const channelId = computed(() => route.params.channelId);
const channel = ref(null);
const playlists = ref([]);
const isLoading = ref(false);
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));

async function loadPage() {
  isLoading.value = true;
  try {
    channel.value = await props.loadChannel(channelId.value);
    const response = await props.loadChannelPlaylists(channelId.value);
    playlists.value = response.playlists || [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadPage);
</script>
