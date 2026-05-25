<template>
  <span class="channel-avatar" aria-hidden="true">
    <img v-if="!hasImageError" :src="imageUrl" :alt="altText" loading="lazy" @error="hasImageError = true" />
    <span v-else>{{ initial }}</span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  channelId: { type: String, required: true },
  label: { type: String, default: 'Channel' },
  channelAvatarUrl: { type: Function, required: true },
});

const hasImageError = ref(false);
const imageUrl = computed(() => props.channelAvatarUrl(props.channelId));
const altText = computed(() => `${props.label || 'Channel'} avatar`);
const initial = computed(() => props.label.trim().charAt(0).toUpperCase() || 'C');

watch(
  imageUrl,
  () => {
    hasImageError.value = false;
  },
);
</script>
