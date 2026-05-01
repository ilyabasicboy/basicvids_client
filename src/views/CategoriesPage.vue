<template>
  <section class="library-grid">
    <article class="panel panel-flat categories-admin-layout">
      <div class="panel-heading inline">
        <div>
          <p class="eyebrow">Admin</p>
          <h2>Categories</h2>
        </div>
        <button type="button" class="ghost-button icon-button" aria-label="Refresh categories" @click="reloadCategories">
          ↻
        </button>
      </div>

      <div v-if="!currentUser?.is_admin" class="empty-state">
        This page is available only to admins.
      </div>

      <template v-else>
        <section class="categories-admin-grid">
          <article class="panel categories-tree-panel">
            <div class="panel-heading inline">
              <div>
                <p class="eyebrow">Tree</p>
                <h2>Current structure</h2>
              </div>
            </div>

            <div v-if="categories.length === 0" class="empty-state">
              No categories yet.
            </div>
            <CategoryAdminTree v-else :categories="categories" @delete="removeCategory" />
          </article>

          <article class="panel categories-form-panel">
            <div class="panel-heading inline">
              <div>
                <p class="eyebrow">Create</p>
                <h2>New category</h2>
              </div>
            </div>

            <form class="auth-form" @submit.prevent="submit">
              <label>
                <span>Name</span>
                <input v-model.trim="form.name" type="text" required placeholder="Education" />
              </label>

              <label>
                <span>Slug</span>
                <input v-model.trim="form.slug" type="text" placeholder="education" />
              </label>

              <label>
                <span>Description</span>
                <textarea v-model.trim="form.description" rows="4" placeholder="Optional short explanation"></textarea>
              </label>

              <label>
                <span>Parent category</span>
                <select v-model="form.parentId">
                  <option value="">Root category</option>
                  <option
                    v-for="option in parentOptions"
                    :key="option.id"
                    :value="String(option.id)"
                    :disabled="option.depth >= 3"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <p class="form-hint">
                Maximum nesting depth: 3 levels.
              </p>

              <button class="primary-button" type="submit" :disabled="isCreatingCategory || !form.name">
                {{ isCreatingCategory ? 'Creating...' : 'Create category' }}
              </button>
            </form>
          </article>
        </section>
      </template>
    </article>
  </section>
</template>

<script setup>
import CategoryAdminTree from '../components/CategoryAdminTree.vue';
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  createCategory: { type: Function, required: true },
  deleteCategory: { type: Function, required: true },
  loadCategories: { type: Function, required: true },
  isCreatingCategory: { type: Boolean, default: false },
});

const form = reactive({
  name: '',
  slug: '',
  description: '',
  parentId: '',
});

const parentOptions = computed(() => flattenCategories(props.categories));
const lastGeneratedSlug = ref('');

watch(
  () => form.name,
  () => {
    const generatedSlug = slugify(form.name);
    if (!form.slug || form.slug === lastGeneratedSlug.value) {
      form.slug = generatedSlug;
    }
    lastGeneratedSlug.value = generatedSlug;
  },
);

function flattenCategories(categories, level = 0) {
  return categories.flatMap((category) => [
    {
      id: category.id,
      depth: category.depth,
      label: `${'— '.repeat(level)}${category.name}`,
    },
    ...flattenCategories(category.children || [], level + 1),
  ]);
}

async function submit() {
  await props.createCategory({
    name: form.name,
    slug: form.slug || null,
    description: form.description || null,
    parent_id: form.parentId ? Number(form.parentId) : null,
  });

  form.name = '';
  form.slug = '';
  form.description = '';
  form.parentId = '';
  lastGeneratedSlug.value = '';
}

async function reloadCategories() {
  await props.loadCategories();
}

async function removeCategory(category) {
  const confirmed = window.confirm(`Delete category "${category.name}"?`);
  if (!confirmed) {
    return;
  }

  await props.deleteCategory(category);
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
</script>
