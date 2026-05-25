<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Explore</p>
          <h2>Channels</h2>
        </div>
        <div class="form-actions">
          <button type="button" class="ghost-button icon-button" aria-label="Refresh channels" @click="loadChannels">
            ↻
          </button>
        </div>
      </div>

      <form class="channel-search-form" role="search" @submit.prevent="searchChannels">
        <label for="channel-search">Search channels</label>
        <div class="video-search-row">
          <div class="search-input-wrap">
            <input
              id="channel-search"
              v-model="searchQuery"
              type="search"
              class="search-input"
              placeholder="Search by name, slug or description"
              autocomplete="off"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-button"
              aria-label="Clear search"
              @click="clearSearch"
            >
              ×
            </button>
          </div>
          <button type="submit" class="ghost-button">Search</button>
        </div>
      </form>

      <div v-if="isLoading" class="empty-state">Loading channels...</div>
      <div v-else-if="channels.length === 0" class="empty-state">
        {{ appliedSearch ? 'No channels match your search.' : 'No channels yet.' }}
      </div>
      <template v-else>
        <ul class="channel-grid">
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
                <small>
                  {{ channel.videos_count }} videos · {{ channel.playlists_count }} playlists · {{ channel.subscribers_count }} subscribers
                </small>
              </div>
            </RouterLink>
          </li>
        </ul>
        <p v-if="count > channels.length" class="result-note">
          Showing {{ channels.length }} of {{ count }} channels. Narrow the search to find more specific channels.
        </p>
      </template>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import ChannelAvatar from '../components/ChannelAvatar.vue';

const props = defineProps({
  listChannels: { type: Function, required: true },
  channelAvatarUrl: { type: Function, required: true },
});

const channels = ref([]);
const count = ref(0);
const searchQuery = ref('');
const appliedSearch = ref('');
const isLoading = ref(false);

async function loadChannels() {
  isLoading.value = true;
  try {
    const response = await props.listChannels({
      search: appliedSearch.value,
      pageSize: 50,
    });
    channels.value = response.channels || [];
    count.value = response.count || 0;
  } finally {
    isLoading.value = false;
  }
}

function searchChannels() {
  appliedSearch.value = searchQuery.value.trim();
  loadChannels();
}

function clearSearch() {
  searchQuery.value = '';
  if (appliedSearch.value) {
    appliedSearch.value = '';
    loadChannels();
  }
}

onMounted(loadChannels);
</script>
