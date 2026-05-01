<template>
  <ul class="category-admin-tree">
    <li v-for="category in categories" :key="category.id" class="category-admin-node">
      <div class="category-admin-item">
        <div class="category-admin-copy">
          <strong>{{ category.name }}</strong>
          <small>{{ category.slug }} · level {{ category.depth }}</small>
        </div>
        <button type="button" class="danger-button category-admin-delete" @click="emit('delete', category)">
          Delete
        </button>
      </div>
      <CategoryAdminTree
        v-if="category.children?.length"
        :categories="category.children"
        class="category-admin-children"
        @delete="emit('delete', $event)"
      />
    </li>
  </ul>
</template>

<script setup>
defineProps({
  categories: { type: Array, required: true },
});

const emit = defineEmits(['delete']);
</script>
