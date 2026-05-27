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
        <template v-else>
          <div class="favorites-tabs" role="tablist" aria-label="User channels">
            <button
              type="button"
              class="favorites-tab"
              :class="{ active: activeTab === 'subscribed' }"
              role="tab"
              :aria-selected="String(activeTab === 'subscribed')"
              @click="activeTab = 'subscribed'"
            >
              Subscribed channels
              <span>{{ subscribedChannels.length }}</span>
            </button>
            <button
              type="button"
              class="favorites-tab"
              :class="{ active: activeTab === 'mine' }"
              role="tab"
              :aria-selected="String(activeTab === 'mine')"
              @click="activeTab = 'mine'"
            >
              My channels
              <span>{{ myChannels.length }}</span>
            </button>
          </div>

          <section class="favorites-section" role="tabpanel">
            <div v-if="visibleChannels.length === 0" class="empty-state">{{ emptyStateText }}</div>
            <ul v-else class="channel-grid">
              <li v-for="channel in visibleChannels" :key="channel.id" class="channel-card">
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
          </section>
        </template>
      </template>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import ChannelAvatar from '../components/ChannelAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  isAuthenticated: { type: Boolean, default: false },
  listMyChannels: { type: Function, required: true },
  listSubscribedChannels: { type: Function, required: true },
  channelAvatarUrl: { type: Function, required: true },
});

const activeTab = ref('subscribed');
const myChannels = ref([]);
const subscribedChannels = ref([]);
const isLoading = ref(false);
const visibleChannels = computed(() => (
  activeTab.value === 'subscribed' ? subscribedChannels.value : myChannels.value
));
const emptyStateText = computed(() => (
  activeTab.value === 'subscribed' ? 'No subscribed channels yet.' : 'No channels created yet.'
));

async function loadChannels() {
  if (!props.isAuthenticated) {
    myChannels.value = [];
    subscribedChannels.value = [];
    return;
  }
  isLoading.value = true;
  try {
    const [ownedResponse, subscribedResponse] = await Promise.all([
      props.listMyChannels(),
      props.listSubscribedChannels(),
    ]);
    myChannels.value = ownedResponse.channels || [];
    subscribedChannels.value = subscribedResponse || [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadChannels);
watch(() => props.currentUser?.id, loadChannels);
</script>
