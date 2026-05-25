<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <h2>Channels</h2>
        </div>
        <div class="form-actions">
          <RouterLink v-if="isAuthenticated" class="ghost-link" to="/channels/create">Create channel</RouterLink>
          <button type="button" class="ghost-button icon-button" aria-label="Refresh channels" @click="loadChannels">↻</button>
        </div>
      </div>
      <div v-if="!isAuthenticated" class="empty-state">
        <RouterLink class="inline-link" to="/auth">Sign in to manage channels.</RouterLink>
      </div>
      <template v-else>
        <div v-if="isLoading" class="empty-state">Loading channels...</div>
        <div v-else-if="channels.length === 0" class="empty-state">No channels yet.</div>
        <ul v-else class="channel-grid">
          <li v-for="channel in channels" :key="channel.id" class="channel-card">
            <RouterLink class="channel-card-link" :to="`/channels/${channel.id}`">
              <ChannelAvatar
                class="channel-card-mark"
                :channel-id="channel.id"
                :label="channel.name"
                :channel-avatar-url="channelAvatarUrl"
              />
              <div class="channel-card-body">
                <strong>{{ channel.name }}</strong>
                <small>@{{ channel.slug }}</small>
                <p>{{ channel.description || 'No description.' }}</p>
                <small>{{ channel.videos_count }} videos · {{ channel.playlists_count }} playlists · {{ channel.subscribers_count }} subscribers</small>
              </div>
            </RouterLink>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import ChannelAvatar from '../components/ChannelAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isAuthenticated: { type: Boolean, default: false },
  listMyChannels: { type: Function, required: true },
  channelAvatarUrl: { type: Function, required: true },
});

const channels = ref([]);
const isLoading = ref(false);

async function loadChannels() {
  if (!props.isAuthenticated) {
    channels.value = [];
    return;
  }
  isLoading.value = true;
  try {
    const response = await props.listMyChannels();
    channels.value = response.channels || [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadChannels);
watch(() => props.currentUser?.id, loadChannels);
</script>
