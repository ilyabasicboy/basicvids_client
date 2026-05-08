<template>
  <section class="library-grid">
    <article class="panel channel-hero-panel">
      <div v-if="isLoading" class="empty-state">Loading channel...</div>
      <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
      <template v-else-if="channel">
        <div class="channel-hero">
          <div class="channel-hero-mark">{{ getInitial(channel.name) }}</div>
          <div>
            <p class="eyebrow">Channel</p>
            <h2>{{ channel.name }}</h2>
            <small>@{{ channel.slug }}</small>
            <p>{{ channel.description || 'No description.' }}</p>
            <small>{{ channel.videos_count }} videos · {{ channel.playlists_count }} playlists · {{ channel.subscribers_count }} subscribers</small>
          </div>
        </div>
        <div class="form-actions">
          <RouterLink class="ghost-link" :to="`/channels/${channel.id}/videos`">Videos</RouterLink>
          <RouterLink class="ghost-link" :to="`/channels/${channel.id}/playlists`">Playlists</RouterLink>
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channel.id}/upload`">Upload video</RouterLink>
          <RouterLink v-if="canManage" class="ghost-link" :to="`/channels/${channel.id}/edit`">Edit channel</RouterLink>
          <button v-if="isAuthenticated && !canManage" type="button" class="primary-button" @click="toggleSubscription">
            {{ channel.is_subscribed ? 'Unsubscribe' : 'Subscribe' }}
          </button>
        </div>
      </template>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isAuthenticated: { type: Boolean, default: false },
  loadChannel: { type: Function, required: true },
  subscribeToChannel: { type: Function, required: true },
  unsubscribeFromChannel: { type: Function, required: true },
  getInitial: { type: Function, required: true },
});

const route = useRoute();
const channel = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const canManage = computed(() => Boolean(channel.value?.owner_id === props.currentUser?.id));

async function loadCurrentChannel() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    channel.value = await props.loadChannel(route.params.channelId);
  } catch (error) {
    errorMessage.value = error.message || 'Channel not found.';
  } finally {
    isLoading.value = false;
  }
}

async function toggleSubscription() {
  if (channel.value.is_subscribed) {
    await props.unsubscribeFromChannel(channel.value.id);
  } else {
    await props.subscribeToChannel(channel.value.id);
  }
  await loadCurrentChannel();
}

onMounted(loadCurrentChannel);
</script>
