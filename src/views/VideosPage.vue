<template>
  <section class="library-grid">
    <article class="panel library-panel panel-flat">
      <div class="panel-heading inline">
        <div>
          <h2>Videos</h2>
        </div>
        <div class="form-actions">
          <button type="button" class="ghost-button icon-button" aria-label="Refresh videos" @click="loadVideos(currentPage)">
            ↻
          </button>
        </div>
      </div>

      <form class="video-search-form" role="search" @submit.prevent="searchVideos()">
        <label for="video-search">Search videos</label>
        <div class="video-search-row">
          <div class="search-input-wrap">
            <input
              id="video-search"
              v-model="searchQuery"
              type="search"
              class="search-input"
              placeholder="Search by title or description"
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
          <button
            type="button"
            class="ghost-button filter-toggle-button"
            :aria-expanded="String(filtersOpen)"
            @click="filtersOpen = !filtersOpen"
          >
            <span>{{ filtersOpen ? 'Hide filter' : 'Show filter' }}</span>
            <strong v-if="activeFilterCount > 0">{{ activeFilterCount }}</strong>
            <small class="filter-toggle-arrow" aria-hidden="true">{{ filtersOpen ? '↑' : '↓' }}</small>
          </button>
          <button type="submit" class="ghost-button">Search</button>
        </div>
        <div v-if="filtersOpen" class="video-filter-row">
          <fieldset class="video-category-filter">
            <legend>Categories</legend>
            <button
              type="button"
              class="video-category-toggle"
              :aria-expanded="String(categoryFilterOpen)"
              @click="categoryFilterOpen = !categoryFilterOpen"
            >
              <span>{{ categoryFilterOpen ? 'Hide categories' : 'Show categories' }}</span>
              <strong>{{ pendingCategoryIds.length }}</strong>
            </button>
            <template v-if="categoryFilterOpen">
              <input
                v-if="categoryOptions.length > 0"
                v-model.trim="categorySearchQuery"
                type="search"
                class="video-category-search"
                placeholder="Search categories"
                autocomplete="off"
              />
              <div class="video-category-options">
                <div v-if="categoryOptions.length === 0" class="video-category-filter-empty">No categories</div>
                <div v-else-if="filteredCategoryOptions.length === 0" class="video-category-filter-empty">
                  No matching categories
                </div>
                <template v-else>
                  <label v-for="option in filteredCategoryOptions" :key="option.id" class="video-category-option">
                    <input v-model="pendingCategoryIds" type="checkbox" :value="String(option.id)" />
                    <span>{{ option.label }}</span>
                  </label>
                </template>
              </div>
            </template>
          </fieldset>
          <label class="video-filter-field">
            <span>Duration</span>
            <select v-model="durationFilter">
              <option value="">Any duration</option>
              <option value="under_3">Less than 3 minutes</option>
              <option value="3_20">3-20 minutes</option>
              <option value="over_20">More than 20 minutes</option>
            </select>
          </label>
          <label class="video-filter-field">
            <span>Upload date</span>
            <select v-model="uploadedFilter">
              <option value="">Any date</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </label>
        </div>
        <button v-if="filtersOpen && hasActiveFilters" type="button" class="ghost-button clear-filter-button" @click="clearFilters">
          Clear
        </button>
      </form>

      <div v-if="isLoadingVideos && displayedVideos.length === 0" class="empty-state">Loading videos...</div>
      <div v-else-if="displayedVideos.length === 0" class="empty-state">
        {{ hasActiveFilters ? 'No videos match your search.' : 'No videos uploaded yet.' }}
      </div>
      <div v-else class="video-list-frame" :class="{ loading: isLoadingVideos }">
        <ul class="video-list">
          <li v-for="video in displayedVideos" :key="video.id" class="video-item">
            <article class="video-card">
              <RouterLink class="video-card-link" :to="`/videos/${video.id}`">
                <div
                  class="video-tile"
                  :class="{ fallback: !video.has_thumbnail }"
                  :style="videoTileStyle(video)"
                >
                  <div v-if="!video.has_thumbnail" class="video-tile-initial">{{ getInitial(video.title || video.original_filename) }}</div>
                  <small v-if="video.status !== 'ready'" class="video-status-badge" :class="video.status">{{ statusLabel(video) }}</small>
                  <small v-if="video.duration_seconds" class="video-duration-badge">
                    <span class="video-duration-text">{{ formatDuration(video.duration_seconds) }}</span>
                  </small>
                </div>
                <div class="video-card-meta">
                  <div class="video-card-title-link">
                <strong class="video-card-title">{{ video.title || video.original_filename }}</strong>
                  </div>
                  <small class="video-author-line user-name-line video-card-author">
                    <UserAvatar :user-id="video.author_id" :label="authorLabel(video)" :avatar-url="avatarUrl" />
                    <span>{{ authorLabel(video) }}</span>
                  </small>
                  <small class="video-engagement-line">
                    <span>{{ formatCount(video.views_count) }} views</span>
                    <span aria-label="Likes">👍 {{ formatCount(video.likes_count) }}</span>
                    <span aria-label="Dislikes">👎 {{ formatCount(video.dislikes_count) }}</span>
                  </small>
                  <small class="video-card-age">{{ formatRelativeTime(video.created_at) }}</small>
                </div>
              </RouterLink>
              <RouterLink
                v-if="video.channel"
                class="video-card-channel-link"
                :to="`/channels/${video.channel.id}`"
              >
                <span class="video-card-channel-mark">{{ getInitial(video.channel.name) }}</span>
                <span>{{ video.channel.name }}</span>
              </RouterLink>
              <button
                v-if="canDelete(video)"
                class="video-tile-delete"
                type="button"
                :aria-label="`Delete ${video.title || video.original_filename}`"
                @click="requestDeleteVideo(video)"
              >
                X
              </button>
            </article>
          </li>
        </ul>
        <div v-if="isLoadingVideos" class="video-list-loader" role="status" aria-label="Searching videos">
          <span class="video-list-spinner" aria-hidden="true"></span>
        </div>
      </div>

      <nav v-if="displayedVideos.length > 0 && videosCount > pageSize" class="pagination" aria-label="Videos pages">
        <button type="button" class="ghost-button" :disabled="isLoadingVideos || currentPage <= 1" @click="goToPage(1)">
          First
        </button>
        <div class="pagination-pages" aria-label="Page numbers">
          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="pagination-page"
            :class="{ active: page === currentPage }"
            :aria-current="page === currentPage ? 'page' : undefined"
            :disabled="isLoadingVideos || page === currentPage"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button type="button" class="ghost-button" :disabled="isLoadingVideos || currentPage >= totalPages" @click="goToPage(totalPages)">
          Last
        </button>
        <span class="pagination-range">{{ pageStart }}-{{ pageEnd }} of {{ videosCount }}</span>
      </nav>

      <Transition name="modal">
        <div v-if="pendingDeleteVideo" class="modal-backdrop" role="presentation" @click.self="closeDeleteModal">
          <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="delete-video-title">
            <div class="panel-heading">
              <p class="eyebrow">Confirm</p>
              <h2 id="delete-video-title">Delete video</h2>
            </div>
            <p class="modal-copy">
              Delete "{{ pendingDeleteVideo.title || pendingDeleteVideo.original_filename }}"?
            </p>
            <div class="form-actions">
              <button class="danger-button" type="button" @click="confirmDeleteVideo">
                Delete video
              </button>
              <button class="ghost-button" type="button" @click="closeDeleteModal">
                Cancel
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import UserAvatar from '../components/UserAvatar.vue';

const props = defineProps({
  currentUser: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  videos: { type: Array, default: () => [] },
  videosCount: { type: Number, default: 0 },
  isAuthenticated: { type: Boolean, default: false },
  isLoadingVideos: { type: Boolean, default: false },
  formatBytes: { type: Function, default: null },
  getInitial: { type: Function, required: true },
  videoThumbnailUrl: { type: Function, required: true },
  avatarUrl: { type: Function, required: true },
});

const emit = defineEmits(['delete-video', 'load-videos']);
const route = useRoute();
const router = useRouter();
const pageSize = 30;
const searchQuery = ref('');
const pendingCategoryIds = ref(route.query.categoryId ? [String(route.query.categoryId)] : []);
const appliedCategoryIds = ref([...pendingCategoryIds.value]);
const categoryFilterOpen = ref(false);
const categorySearchQuery = ref('');
const durationFilter = ref('');
const uploadedFilter = ref('');
const currentPage = ref(1);
const displayedVideos = ref([...props.videos]);
const pendingDeleteVideo = ref(null);
const filtersOpen = ref(false);

const totalPages = computed(() => Math.max(1, Math.ceil(props.videosCount / pageSize)));
const pageStart = computed(() => (props.videosCount === 0 ? 0 : (currentPage.value - 1) * pageSize + 1));
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, props.videosCount));
const categoryOptions = computed(() => flattenCategories(props.categories));
const filteredCategoryOptions = computed(() => flattenCategories(filterCategoryTree(props.categories, categorySearchQuery.value)));
const hasActiveFilters = computed(() => Boolean(
  searchQuery.value.trim()
  || appliedCategoryIds.value.length > 0
  || durationFilter.value
  || uploadedFilter.value,
));
const activeFilterCount = computed(() => (
  (appliedCategoryIds.value.length > 0 ? 1 : 0)
  + (durationFilter.value ? 1 : 0)
  + (uploadedFilter.value ? 1 : 0)
));
const selectedCategories = computed(() => appliedCategoryIds.value
  .map((categoryId) => findCategoryById(Number(categoryId), props.categories))
  .filter(Boolean));

watch(
  () => [props.videos, props.isLoadingVideos],
  ([videos, isLoadingVideos]) => {
    if (!isLoadingVideos) {
      displayedVideos.value = [...videos];
    }
  },
);

watch(
  () => [route.query.categoryId, route.query.autoSearch],
  ([categoryId, autoSearch]) => {
    pendingCategoryIds.value = categoryId ? [String(categoryId)] : [];
    if (autoSearch === '1') {
      searchVideos();
    }
  },
);

onMounted(() => {
  loadVideos(1);
});

function searchVideos() {
  appliedCategoryIds.value = [...pendingCategoryIds.value];
  loadVideos(1);
}

function clearSearch() {
  searchQuery.value = '';
}

function loadVideos(page = currentPage.value) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
  emit('load-videos', {
    search: searchQuery.value.trim(),
    categoryIds: appliedCategoryIds.value.map((categoryId) => Number(categoryId)),
    duration: durationFilter.value,
    uploaded: uploadedFilter.value,
    offset: (currentPage.value - 1) * pageSize,
    limit: pageSize,
  });
}

async function clearFilters() {
  searchQuery.value = '';
  categorySearchQuery.value = '';
  pendingCategoryIds.value = [];
  appliedCategoryIds.value = [];
  durationFilter.value = '';
  uploadedFilter.value = '';
  categoryFilterOpen.value = false;
  if (route.query.categoryId) {
    await router.push('/videos');
  }
  loadVideos(1);
}

function goToPage(page) {
  loadVideos(page);
}

function canDelete(video) {
  return Boolean(props.currentUser?.is_admin || (props.currentUser?.id && props.currentUser.id === video.author_id));
}

function requestDeleteVideo(video) {
  pendingDeleteVideo.value = video;
}

function closeDeleteModal() {
  pendingDeleteVideo.value = null;
}

function confirmDeleteVideo() {
  if (pendingDeleteVideo.value) {
    emit('delete-video', pendingDeleteVideo.value);
    closeDeleteModal();
  }
}

function authorLabel(video) {
  if (props.currentUser?.id === video.author_id) {
    const currentUserName = [props.currentUser.first_name, props.currentUser.last_name].filter(Boolean).join(' ');
    return currentUserName || props.currentUser.username || 'You';
  }

  const fullName = [video.author_first_name, video.author_last_name].filter(Boolean).join(' ');
  return fullName || video.author_username || 'Unknown author';
}

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function statusLabel(video) {
  if (video.status === 'processing') {
    return 'Processing';
  }

  if (video.status === 'failed') {
    return 'Failed';
  }

  return 'Ready';
}

function pluralizeRu(value, forms) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}

function formatDuration(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const ranges = [
    { limit: 60, unitSeconds: 1, forms: ['секунду', 'секунды', 'секунд'] },
    { limit: 3600, unitSeconds: 60, forms: ['минуту', 'минуты', 'минут'] },
    { limit: 86400, unitSeconds: 3600, forms: ['час', 'часа', 'часов'] },
    { limit: 2592000, unitSeconds: 86400, forms: ['день', 'дня', 'дней'] },
    { limit: 31536000, unitSeconds: 2592000, forms: ['месяц', 'месяца', 'месяцев'] },
    { limit: Number.POSITIVE_INFINITY, unitSeconds: 31536000, forms: ['год', 'года', 'лет'] },
  ];

  for (const range of ranges) {
    if (diffSeconds < range.limit) {
      const amount = Math.max(1, Math.floor(diffSeconds / range.unitSeconds));
      return `${amount} ${pluralizeRu(amount, range.forms)} назад`;
    }
  }

  return '';
}

function videoTileStyle(video) {
  if (!video.has_thumbnail) {
    return {};
  }

  return {
    backgroundImage: `url("${props.videoThumbnailUrl(video.id)}")`,
  };
}

function flattenCategories(categories, level = 0) {
  return categories.flatMap((category) => [
    {
      id: category.id,
      label: `${'— '.repeat(level)}${category.name}`,
    },
    ...flattenCategories(category.children || [], level + 1),
  ]);
}

function normalizeSearchValue(value) {
  return value.trim().toLowerCase();
}

function filterCategoryTree(categories, searchValue) {
  const query = normalizeSearchValue(searchValue);
  if (!query) {
    return categories;
  }

  return categories.flatMap((category) => {
    const name = normalizeSearchValue(category.name || '');
    const slug = normalizeSearchValue(category.slug || '');
    const matches = name.includes(query) || slug.includes(query);
    const children = matches ? (category.children || []) : filterCategoryTree(category.children || [], query);

    if (!matches && children.length === 0) {
      return [];
    }

    return [{ ...category, children }];
  });
}

function findCategoryById(categoryId, categories) {
  if (!categoryId) {
    return null;
  }

  for (const category of categories) {
    if (category.id === categoryId) {
      return category;
    }
    const childMatch = findCategoryById(categoryId, category.children || []);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}
</script>
