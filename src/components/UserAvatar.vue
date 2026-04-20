<template>
  <span class="user-avatar" aria-hidden="true">
    <img
      v-if="shouldLoadImage"
      :src="imageUrl"
      :alt="altText"
      loading="lazy"
      @error="hasImageError = true"
    />
    <span v-else class="default-avatar">
      <span class="default-avatar-eyes">o o</span>
      <span class="default-avatar-mouth">v</span>
    </span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  userId: { type: Number, default: null },
  label: { type: String, default: 'User' },
  avatarUrl: { type: Function, required: true },
});

const hasImageError = ref(false);
const shouldLoadImage = computed(() => Boolean(props.userId && !hasImageError.value));
const imageUrl = computed(() => (props.userId ? props.avatarUrl(props.userId) : ''));
const altText = computed(() => `${props.label || 'User'} avatar`);

watch(
  imageUrl,
  () => {
    hasImageError.value = false;
  },
);
</script>
