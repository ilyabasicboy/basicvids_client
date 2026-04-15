<template>
  <section class="future-section">
    <article v-for="service in futureServices" :key="service.name" class="future-item">
      <img :src="service.image" :alt="service.name" />
      <div>
        <span>{{ service.name }}</span>
        <strong>{{ service.route }}</strong>
        <small>{{ service.note }}</small>
      </div>
    </article>
  </section>
</template>

<script setup>
defineProps({
  futureServices: { type: Array, default: () => [] },
});
</script>
