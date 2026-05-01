<template>
  <li class="category-tree-node">
    <div class="category-tree-row" :class="{ active: isActive, branch: hasChildren }">
      <button
        v-if="hasChildren"
        type="button"
        class="category-tree-toggle"
        :aria-expanded="String(isExpanded)"
        :aria-label="isExpanded ? `Collapse ${category.name}` : `Expand ${category.name}`"
        @click="emit('toggle', category.id)"
      >
        <span class="category-tree-chevron" :class="{ expanded: isExpanded }">›</span>
      </button>
      <span v-else class="category-tree-spacer" aria-hidden="true"></span>

      <button
        type="button"
        class="category-tree-link"
        :class="{ active: isActive }"
        @click="emit('select', category)"
      >
        <span class="category-tree-label">{{ category.name }}</span>
      </button>
    </div>

    <ul v-if="hasChildren && isExpanded" class="category-tree-children">
      <CategoryTreeItem
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :expanded-ids="expandedIds"
        :active-category-id="activeCategoryId"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  category: { type: Object, required: true },
  expandedIds: { type: Object, required: true },
  activeCategoryId: { type: [Number, String], default: null },
});

const emit = defineEmits(['toggle', 'select']);

const hasChildren = computed(() => Array.isArray(props.category.children) && props.category.children.length > 0);
const isExpanded = computed(() => props.expandedIds.has(props.category.id));
const isActive = computed(() => Number(props.activeCategoryId) === props.category.id);
</script>
