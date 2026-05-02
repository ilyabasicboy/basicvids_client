<template>
  <main class="app-shell">
    <section class="workspace" :class="{ collapsed: isSidebarCollapsed }">
      <aside class="sidebar" aria-label="BasicVids navigation">
        <RouterLink class="brand" to="/videos" @click="closeUserMenu">
          <span class="brand-mark">BV</span>
          <div v-if="!isSidebarCollapsed">
            <strong>BasicVids</strong>
            <span>Home</span>
          </div>
        </RouterLink>

        <nav class="nav-list" aria-label="Sections">
          <component
            v-for="item in navItems"
            :key="item.id"
            :is="item.to ? RouterLink : 'button'"
            :to="item.to || undefined"
            type="button"
            class="nav-item"
            :class="{ active: isNavActive(item), placeholder: !item.to }"
            :disabled="!item.to"
            @click="onNavItemClick(item)"
          >
            <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
            <strong v-else>{{ item.shortLabel }}</strong>
            <small v-if="!isSidebarCollapsed">{{ item.status }}</small>
          </component>
        </nav>

        <section v-if="!isSidebarCollapsed" class="sidebar-categories">
          <button
            type="button"
            class="sidebar-section-toggle"
            :aria-expanded="String(sidebarCategoriesOpen)"
            @click="toggleSidebarCategories"
          >
            <span>Categories</span>
            <strong>{{ sidebarCategoriesOpen ? '−' : '+' }}</strong>
          </button>

          <div v-if="sidebarCategoriesOpen" class="sidebar-section-body">
            <input
              v-if="categories.length > 0"
              v-model.trim="sidebarCategorySearch"
              type="search"
              class="sidebar-category-search"
              placeholder="Search categories"
              autocomplete="off"
            />
            <div class="sidebar-category-scroll">
              <div v-if="categories.length === 0" class="sidebar-empty">
                No categories yet.
              </div>
              <button
                v-if="activeCategoryId"
                type="button"
                class="sidebar-clear-filter"
                @click="clearCategoryFilter"
              >
                Clear filter
              </button>
              <ul v-if="visibleSidebarCategories.length > 0" class="category-tree">
                <CategoryTreeItem
                  v-for="category in visibleSidebarCategories"
                  :key="category.id"
                  :category="category"
                  :expanded-ids="visibleExpandedCategoryIds"
                  :active-category-id="activeCategoryId"
                  @toggle="toggleCategoryNode"
                  @select="handleCategorySelect"
                />
              </ul>
              <div v-else-if="categories.length > 0" class="sidebar-empty">
                No matching categories.
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          class="nav-item sidebar-toggle"
          :class="{ collapsed: isSidebarCollapsed }"
          :aria-expanded="String(!isSidebarCollapsed)"
          :aria-label="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleSidebar"
        >
          <span class="sidebar-toggle-icon" aria-hidden="true">
            <span></span>
          </span>
        </button>

        <div ref="userMenuRef" class="user-menu sidebar-user-menu" :class="{ collapsed: isSidebarCollapsed }">
          <button
            type="button"
            class="user-menu-trigger sidebar-user-trigger"
            :aria-expanded="String(userMenuOpen)"
            @click.stop="toggleUserMenu"
          >
            <UserAvatar :user-id="currentUser?.id || null" :label="userLabel" :avatar-url="avatarUrl" />
            <span v-if="!isSidebarCollapsed">{{ userLabel }}</span>
          </button>

          <Transition name="dropdown">
            <div v-if="userMenuOpen" class="user-menu-dropdown user-menu-dropdown-up">
              <template v-if="isAuthenticated">
                <RouterLink class="user-menu-link" to="/current-user" @click="closeUserMenu">
                  User details
                </RouterLink>
                <RouterLink class="user-menu-link" to="/user-videos" @click="closeUserMenu">
                  Videos
                </RouterLink>
                <RouterLink class="user-menu-link" to="/watch-history" @click="closeUserMenu">
                  Watch history
                </RouterLink>
                <RouterLink v-if="currentUser?.is_admin" class="user-menu-link" to="/categories" @click="closeUserMenu">
                  Manage categories
                </RouterLink>
                <button type="button" class="user-menu-link" @click="handleLogout">
                  Log out
                </button>
              </template>
              <template v-else>
                <RouterLink class="user-menu-link" to="/auth" @click="closeUserMenu">
                  Log in
                </RouterLink>
                <RouterLink class="user-menu-link" to="/create-account" @click="closeUserMenu">
                  Create Account
                </RouterLink>
              </template>
            </div>
          </Transition>
        </div>
      </aside>

      <section class="content">
        <header class="topbar">
          <button type="button" class="ghost-button mobile-sidebar-toggle" @click="toggleSidebar">
            {{ isSidebarCollapsed ? 'Open menu' : 'Close menu' }}
          </button>
        </header>

        <nav v-if="breadcrumbs.length > 0" class="breadcrumbs" aria-label="Breadcrumbs">
          <RouterLink
            v-for="(crumb, index) in breadcrumbs"
            :key="`${crumb.label}-${crumb.to || index}`"
            :to="crumb.to"
            class="breadcrumb-link"
            :class="{ current: index === breadcrumbs.length - 1 }"
            :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
          >
            <span>{{ crumb.label }}</span>
          </RouterLink>
        </nav>

        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            :current-user="currentUser"
            :current-user-text="currentUserText"
            :avatar-url="avatarUrl"
            :format-bytes="formatBytes"
            :get-initial="getInitial"
            :change-video="changeVideo"
            :is-authenticated="isAuthenticated"
            :is-changing-video="isChangingVideo"
            :is-changing-user="isChangingUser"
            :is-changing-password="isChangingPassword"
            :is-confirming-email="isConfirmingEmail"
            :is-creating-account="isCreatingAccount"
            :is-deleting-user="isDeletingUser"
            :is-loading-videos="isLoadingVideos"
            :is-signing-in="isSigningIn"
            :is-uploading="isUploading"
            :upload-progress="uploadProgress"
            :upload-progress-text="uploadProgressText"
            :upload-status="uploadStatus"
            :load-video="loadVideo"
            :load-comments="loadComments"
            :create-comment="createComment"
            :delete-comment="deleteComment"
            :load-video-engagement="loadVideoEngagement"
            :set-video-reaction="setVideoReaction"
            :register-video-view="registerVideoView"
            :load-watch-history="loadWatchHistory"
            :get-video-history="getVideoHistory"
            :save-video-history="saveVideoHistory"
            :delete-video-history="deleteVideoHistory"
            :clear-watch-history="clearWatchHistory"
            :upload-file="uploadFile"
            :video-thumbnail-url="videoThumbnailUrl"
            :video-hls-url="videoHlsUrl"
            :video-url="videoUrl"
            :videos="videos"
            :videos-count="videosCount"
            :categories="categories"
            :load-categories="loadCategories"
            :create-category="createCategory"
            :delete-category="deleteCategory"
            :is-creating-category="isCreatingCategory"
            @change-user="changeUser"
            @change-password="changePassword"
            @confirm-email="confirmEmail"
            @create-account="createAccount"
            @delete-user="deleteUser"
            @delete-video="deleteVideo"
            @drop-video="onDrop"
            @load-videos="loadVideos"
            @login="login"
            @select-video="onFileSelect"
            @upload-video="uploadSelectedVideo"
          />
        </RouterView>

        <Transition name="message">
          <p v-if="message" class="message" :class="messageType">{{ message }}</p>
        </Transition>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { api } from './api';
import CategoryTreeItem from './components/CategoryTreeItem.vue';
import UserAvatar from './components/UserAvatar.vue';

const route = useRoute();
const router = useRouter();
const videos = ref([]);
const videosCount = ref(0);
const isLoadingVideos = ref(false);
const uploadFile = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadProgressText = ref('');
const uploadStatus = ref('');
const isChangingVideo = ref(false);
const isChangingUser = ref(false);
const isChangingPassword = ref(false);
const isConfirmingEmail = ref(false);
const isCreatingAccount = ref(false);
const isDeletingUser = ref(false);
const isSigningIn = ref(false);
const currentUser = ref(null);
const avatarVersion = ref(Date.now());
const authToken = ref(localStorage.getItem('basicvids_access_token'));
const pendingConfirmCredentials = ref(null);
const message = ref('');
const messageType = ref('info');
const isSidebarCollapsed = ref(false);
const sidebarCategoriesOpen = ref(true);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
const categories = ref([]);
const isCreatingCategory = ref(false);
const expandedCategoryIds = ref(new Set());
const sidebarCategorySearch = ref('');
let messageTimerId = null;
let videosRequestId = 0;

const isAuthenticated = computed(() => Boolean(authToken.value));
const navItems = computed(() => {
  return [
    { id: 'home', label: 'Home', shortLabel: 'H', status: 'Videos', to: '/videos', activePaths: ['/videos'] },
  ];
});
const userLabel = computed(() => currentUser.value?.username || currentUser.value?.email || 'Guest');
const currentUserText = computed(() => (currentUser.value ? JSON.stringify(currentUser.value, null, 2) : 'No signed-in user loaded.'));
const activeCategoryId = computed(() => {
  if (route.path !== '/videos') {
    return null;
  }

  const value = Number(route.query.categoryId);
  return Number.isFinite(value) && value > 0 ? value : null;
});
const visibleSidebarCategories = computed(() => filterCategoryTree(categories.value, sidebarCategorySearch.value));
const visibleExpandedCategoryIds = computed(() => {
  if (!sidebarCategorySearch.value.trim()) {
    return expandedCategoryIds.value;
  }
  return new Set([
    ...expandedCategoryIds.value,
    ...collectSearchExpandedCategoryIds(visibleSidebarCategories.value, sidebarCategorySearch.value),
  ]);
});
const breadcrumbs = computed(() => {
  if (route.path === '/' || route.path === '/videos') {
    return [{ label: 'Home', to: '/videos' }];
  }

  if (route.path === '/categories') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Categories', to: '/categories' },
    ];
  }

  if (route.path === '/videos/upload') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Upload video', to: '/videos/upload' },
    ];
  }

  if (route.path.startsWith('/videos/')) {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Video', to: route.fullPath },
    ];
  }

  if (route.path === '/user-videos') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'User videos', to: '/user-videos' },
    ];
  }

  if (route.path === '/watch-history') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Watch history', to: '/watch-history' },
    ];
  }

  if (route.path === '/current-user') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'User details', to: '/current-user' },
    ];
  }

  if (route.path === '/auth') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Log in', to: '/auth' },
    ];
  }

  if (route.path === '/create-account') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Create account', to: '/create-account' },
    ];
  }

  if (route.path === '/confirm-email') {
    return [
      { label: 'Home', to: '/videos' },
      { label: 'Confirm email', to: route.fullPath },
    ];
  }

  return [{ label: 'Home', to: '/videos' }];
});

function setMessage(text, type = 'info') {
  message.value = text;
  messageType.value = type;

  if (messageTimerId) {
    clearTimeout(messageTimerId);
  }

  if (text) {
    messageTimerId = window.setTimeout(() => {
      message.value = '';
      messageTimerId = null;
    }, 5000);
  }
}

function isNavActive(item) {
  if (!item.to) {
    return false;
  }

  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`));
}

function mergeVideoEngagement(video, engagement) {
  return {
    ...video,
    likes_count: engagement?.likes_count ?? 0,
    dislikes_count: engagement?.dislikes_count ?? 0,
    views_count: engagement?.views_count ?? 0,
    user_reaction: engagement?.user_reaction ?? null,
  };
}

async function attachEngagementToVideos(videoItems) {
  if (!Array.isArray(videoItems) || videoItems.length === 0) {
    return [];
  }

  try {
    const response = await api.getVideoEngagementSummaries(videoItems.map((video) => video.id));
    const summaryByVideoId = Object.fromEntries((response.items || []).map((item) => [item.video_id, item]));
    return videoItems.map((video) => mergeVideoEngagement(video, summaryByVideoId[video.id]));
  } catch {
    return videoItems.map((video) => mergeVideoEngagement(video));
  }
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function toggleSidebarCategories() {
  sidebarCategoriesOpen.value = !sidebarCategoriesOpen.value;
}

function onNavItemClick(item) {
  if (!item.to) {
    return;
  }

  closeUserMenu();
}

function closeUserMenu() {
  userMenuOpen.value = false;
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function handleDocumentClick(event) {
  if (!userMenuRef.value?.contains(event.target)) {
    closeUserMenu();
  }
}

async function loadVideos(options = {}) {
  const normalizedOptions = typeof options === 'string' ? { search: options } : options;
  const requestId = ++videosRequestId;
  isLoadingVideos.value = true;
  try {
    const response = await api.listVideos(normalizedOptions);
    const hydratedVideos = await attachEngagementToVideos(response.videos || []);
    if (requestId !== videosRequestId) {
      return;
    }
    videos.value = hydratedVideos;
    videosCount.value = response.count || 0;
  } catch (error) {
    if (requestId === videosRequestId) {
      setMessage(error.message, 'error');
    }
  } finally {
    if (requestId === videosRequestId) {
      isLoadingVideos.value = false;
    }
  }
}

async function loadCategories() {
  try {
    categories.value = await api.listCategories();
    if (expandedCategoryIds.value.size === 0) {
      expandedCategoryIds.value = new Set(categories.value.map((category) => category.id));
    }
    ensureActiveCategoryPathExpanded();
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function createCategory(payload) {
  isCreatingCategory.value = true;
  try {
    await api.createCategory(payload);
    await loadCategories();
    setMessage('Category created.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
    throw error;
  } finally {
    isCreatingCategory.value = false;
  }
}

async function deleteCategory(category) {
  try {
    await api.deleteCategory(category.id);
    await loadCategories();
    if (activeCategoryId.value === category.id) {
      await clearCategoryFilter();
    }
    setMessage('Category deleted.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
    throw error;
  }
}

async function loadVideo(videoId) {
  const cachedVideo = videos.value.find((video) => video.id === videoId);
  if (cachedVideo?.status === 'ready') {
    return cachedVideo;
  }

  const [video, engagement] = await Promise.all([
    api.getVideo(videoId),
    api.getVideoEngagement(videoId).catch(() => null),
  ]);
  const hydratedVideo = mergeVideoEngagement(video, engagement);
  const existingIndex = videos.value.findIndex((item) => item.id === video.id);
  if (existingIndex >= 0) {
    videos.value = videos.value.map((item) => (item.id === hydratedVideo.id ? hydratedVideo : item));
  }
  return hydratedVideo;
}

async function loadVideoEngagement(videoId) {
  return api.getVideoEngagement(videoId);
}

async function setVideoReaction(videoId, reaction) {
  try {
    const summary = await api.setVideoReaction(videoId, reaction);
    const existingIndex = videos.value.findIndex((item) => item.id === videoId);
    if (existingIndex >= 0) {
      videos.value = videos.value.map((item) => (item.id === videoId ? mergeVideoEngagement(item, summary) : item));
    }
    return summary;
  } catch (error) {
    setMessage(error.message, 'error');
    throw error;
  }
}

async function registerVideoView(videoId, watchedSeconds = null) {
  try {
    const summary = await api.registerVideoView(videoId, watchedSeconds);
    const existingIndex = videos.value.findIndex((item) => item.id === videoId);
    if (existingIndex >= 0) {
      videos.value = videos.value.map((item) => (item.id === videoId ? mergeVideoEngagement(item, summary) : item));
    }
    return summary;
  } catch (error) {
    return null;
  }
}

async function loadWatchHistory(options = {}) {
  const response = await api.listVideoHistory(options);
  const items = await Promise.all((response.items || []).map(async (item) => {
    try {
      const video = await loadVideo(item.video_id);
      return { ...item, video };
    } catch {
      return { ...item, video: null };
    }
  }));
  return {
    items,
    count: response.count || 0,
  };
}

async function getVideoHistory(videoId) {
  return api.getVideoHistory(videoId);
}

async function saveVideoHistory(videoId, payload) {
  return api.upsertVideoHistory(videoId, payload);
}

async function deleteVideoHistory(videoId) {
  return api.deleteVideoHistory(videoId);
}

async function clearWatchHistory() {
  return api.clearVideoHistory();
}

async function loadComments(videoId) {
  return api.listComments(videoId);
}

async function createComment(videoId, text) {
  try {
    const comment = await api.createComment(videoId, text);
    setMessage('Comment added.', 'success');
    return comment;
  } catch (error) {
    setMessage(error.message, 'error');
    throw error;
  }
}

async function deleteComment(commentId) {
  try {
    await api.deleteComment(commentId);
    setMessage('Comment deleted.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
    throw error;
  }
}

async function login(credentials) {
  isSigningIn.value = true;
  try {
    const response = await api.login(credentials.identifier, credentials.password);
    await applyAuthResponse(response);
    await router.push('/videos');
    setMessage('Signed in.', 'success');
  } catch (error) {
    if (error.message === 'Email is not confirmed') {
      const email = credentials.identifier.includes('@') ? credentials.identifier : '';
      pendingConfirmCredentials.value = { ...credentials };
      await router.push({ path: '/confirm-email', query: email ? { email } : {} });
      setMessage('Confirm your email before signing in.', 'error');
      return;
    }
    setMessage(error.message, 'error');
  } finally {
    isSigningIn.value = false;
  }
}

async function applyAuthResponse(response) {
  localStorage.setItem('basicvids_access_token', response.access_token);
  localStorage.setItem('basicvids_refresh_token', response.refresh_token);
  authToken.value = response.access_token;
  currentUser.value = await api.currentUser();
}

async function createAccount(account) {
  if (account.password !== account.confirmPassword) {
    setMessage('Passwords do not match.', 'error');
    return;
  }

  isCreatingAccount.value = true;
  try {
    const createdUser = await api.createAccount({
      username: account.username,
      first_name: account.firstName || null,
      last_name: account.lastName || null,
      email: account.email,
      password: account.password,
    });

    let avatarUploadFailed = false;
    if (account.avatar) {
      try {
        await api.uploadRegistrationAvatar(createdUser.id, account.avatar);
        avatarVersion.value = Date.now();
      } catch (error) {
        avatarUploadFailed = true;
        setMessage(`Account created, but avatar upload failed: ${error.message}`, 'error');
      }
    }

    pendingConfirmCredentials.value = {
      identifier: account.username,
      password: account.password,
    };
    await router.push({ path: '/confirm-email', query: { email: createdUser.email } });
    if (!avatarUploadFailed) {
      setMessage('Account created. Confirm your email to sign in.', 'success');
    }
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isCreatingAccount.value = false;
  }
}

async function confirmEmail(data) {
  isConfirmingEmail.value = true;
  try {
    await api.confirmEmail({
      email: data.email,
      code: data.code,
    });

    if (pendingConfirmCredentials.value) {
      const response = await api.login(
        pendingConfirmCredentials.value.identifier,
        pendingConfirmCredentials.value.password,
      );
      await applyAuthResponse(response);
      pendingConfirmCredentials.value = null;
      await router.push('/videos');
      setMessage('Email confirmed. Signed in.', 'success');
      return;
    }

    await router.push('/auth');
    setMessage('Email confirmed. Sign in to continue.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isConfirmingEmail.value = false;
  }
}

async function changeUser(user) {
  isChangingUser.value = true;
  try {
    currentUser.value = await api.changeUser({
      first_name: user.firstName || null,
      last_name: user.lastName || null,
    });
    if (user.avatar) {
      await api.uploadCurrentUserAvatar(user.avatar);
      avatarVersion.value = Date.now();
    }
    setMessage('Account details updated.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isChangingUser.value = false;
  }
}

async function changePassword(passwords) {
  if (passwords.newPassword !== passwords.confirmPassword) {
    setMessage('Passwords do not match.', 'error');
    return;
  }

  isChangingPassword.value = true;
  try {
    await api.changePassword({
      old_password: passwords.oldPassword,
      new_password: passwords.newPassword,
    });
    setMessage('Password changed.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isChangingPassword.value = false;
  }
}

async function deleteUser() {
  isDeletingUser.value = true;
  try {
    try {
      await api.deleteCurrentUserAvatar();
    } catch (error) {
      if (!error.message.includes('not found')) {
        throw error;
      }
    }
    await api.deleteCurrentUser();
    logout('Account deleted.', 'success');
    await router.push('/videos');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isDeletingUser.value = false;
  }
}

function logout(text = 'Signed out.', type = 'info') {
  localStorage.removeItem('basicvids_access_token');
  localStorage.removeItem('basicvids_refresh_token');
  authToken.value = null;
  currentUser.value = null;
  closeUserMenu();
  setMessage(typeof text === 'string' ? text : 'Signed out.', type);
}

async function handleLogout() {
  logout();
  await router.push('/videos');
}

function onFileSelect(event) {
  uploadFile.value = event.target.files?.[0] || null;
}

function onDrop(event) {
  uploadFile.value = event.dataTransfer.files?.[0] || null;
}

function setUploadState(progress, status, text = '') {
  uploadProgress.value = Math.max(0, Math.min(100, Math.round(progress)));
  uploadStatus.value = status;
  uploadProgressText.value = text;
}

function clearUploadState() {
  uploadProgress.value = 0;
  uploadStatus.value = '';
  uploadProgressText.value = '';
}

function resumableUploadStorageKey(file) {
  return [
    'basicvids_resumable_upload',
    currentUser.value?.id || 'guest',
    file.name,
    file.size,
    file.lastModified,
    file.type || 'application/octet-stream',
  ].join(':');
}

function loadSavedUploadSession(file) {
  try {
    const rawValue = localStorage.getItem(resumableUploadStorageKey(file));
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function saveUploadSession(file, payload) {
  localStorage.setItem(resumableUploadStorageKey(file), JSON.stringify(payload));
}

function clearSavedUploadSession(file) {
  localStorage.removeItem(resumableUploadStorageKey(file));
}

async function ensureUploadSession(file, upload) {
  const savedSession = loadSavedUploadSession(file);
  if (savedSession?.uploadId) {
    try {
      const existingSession = await api.getVideoUploadSession(savedSession.uploadId);
      if (
        existingSession.original_filename === file.name
        && existingSession.total_size_bytes === file.size
        && existingSession.content_type === (file.type || 'video/mp4')
      ) {
        return existingSession;
      }
    } catch {
      clearSavedUploadSession(file);
    }
  }

  const createdSession = await api.createVideoUploadSession({
    title: upload?.title?.trim() || file.name,
    description: upload?.description?.trim() || null,
    category_id: upload?.categoryId || null,
    original_filename: file.name,
    content_type: file.type || 'video/mp4',
    total_size_bytes: file.size,
  });
  saveUploadSession(file, { uploadId: createdSession.id });
  return createdSession;
}

async function waitForVideoReady(videoId, attempts = 90, delayMs = 2000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const video = await api.getVideo(videoId);
    if (video.status === 'ready') {
      return video;
    }
    if (video.status === 'failed') {
      throw new Error(video.processing_error || 'Video processing failed.');
    }
    await new Promise((resolve) => {
      window.setTimeout(resolve, delayMs);
    });
  }

  throw new Error('Video processing is taking too long.');
}

async function uploadSelectedVideo(upload) {
  if (!isAuthenticated.value) {
    setMessage('Sign in to upload videos.', 'error');
    await router.push('/auth');
    return;
  }

  const file = upload?.file || uploadFile.value;
  if (!file) {
    return;
  }

  isUploading.value = true;
  clearUploadState();
  try {
    let uploadSession = await ensureUploadSession(file, upload);
    const totalChunks = uploadSession.total_chunks || Math.ceil(file.size / uploadSession.chunk_size_bytes);
    let uploadedBytes = uploadSession.received_size_bytes || 0;
    setUploadState(
      (uploadedBytes / Math.max(file.size, 1)) * 100,
      'Uploading video',
      `${formatBytes(uploadedBytes)} of ${formatBytes(file.size)}`,
    );

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      if ((uploadSession.received_chunks || []).includes(chunkIndex)) {
        continue;
      }

      const chunkStart = chunkIndex * uploadSession.chunk_size_bytes;
      const chunkEnd = Math.min(chunkStart + uploadSession.chunk_size_bytes, file.size);
      const chunk = file.slice(chunkStart, chunkEnd);
      uploadSession = await api.uploadVideoChunk(uploadSession.id, chunkIndex, chunk);
      uploadedBytes = uploadSession.received_size_bytes || chunkEnd;
      setUploadState(
        (uploadedBytes / Math.max(file.size, 1)) * 100,
        'Uploading video',
        `${formatBytes(uploadedBytes)} of ${formatBytes(file.size)}`,
      );
    }

    setUploadState(100, 'Finalizing upload', 'Assembling file and starting processing');
    const createdVideo = await api.completeVideoUploadSession(uploadSession.id);
    clearSavedUploadSession(file);

    if (upload?.thumbnail) {
      setUploadState(100, 'Processing video', 'Waiting until thumbnail can be attached');
      await waitForVideoReady(createdVideo.id);
      await api.uploadVideoThumbnail(createdVideo.id, upload.thumbnail);
    }

    uploadFile.value = null;
    clearUploadState();
    await loadVideos();
    await router.push('/videos');
    setMessage('Video uploaded. Processing started.', 'success');
  } catch (error) {
    setUploadState(uploadProgress.value, 'Upload paused', 'Retry the same file to continue from the last uploaded chunk.');
    setMessage(error.message, 'error');
  } finally {
    isUploading.value = false;
  }
}

async function changeVideo(videoId, metadata) {
  isChangingVideo.value = true;
  try {
    const changedVideo = await api.changeVideo(videoId, metadata);
    videos.value = videos.value.map((video) => (video.id === changedVideo.id ? changedVideo : video));
    setMessage('Video details updated.', 'success');
    return changedVideo;
  } catch (error) {
    setMessage(error.message, 'error');
    throw error;
  } finally {
    isChangingVideo.value = false;
  }
}

async function deleteVideo(video) {
  try {
    await api.deleteVideo(video.id);
    videos.value = videos.value.filter((item) => item.id !== video.id);
    videosCount.value = Math.max(0, videosCount.value - 1);
    if (route.path === `/videos/${video.id}`) {
      await router.push('/videos');
    }
    setMessage('Video deleted.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

function formatBytes(value = 0) {
  if (!value) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getInitial(value = '') {
  return value.trim().charAt(0).toUpperCase() || 'V';
}

function videoUrl(videoId, quality = null) {
  return api.videoUrl(videoId, quality);
}

function videoHlsUrl(videoId) {
  return api.videoHlsUrl(videoId);
}

function videoThumbnailUrl(videoId) {
  return api.videoThumbnailUrl(videoId);
}

function avatarUrl(userId) {
  return `${api.userAvatarUrl(userId)}?v=${avatarVersion.value}`;
}

function normalizeSearchValue(value) {
  return value.trim().toLowerCase();
}

function filterCategoryTree(nodes, searchValue) {
  const query = normalizeSearchValue(searchValue);
  if (!query) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    const name = normalizeSearchValue(node.name || '');
    const slug = normalizeSearchValue(node.slug || '');
    const matches = name.includes(query) || slug.includes(query);
    const children = matches ? (node.children || []) : filterCategoryTree(node.children || [], query);

    if (!matches && children.length === 0) {
      return [];
    }

    return [{ ...node, children }];
  });
}

function collectSearchExpandedCategoryIds(nodes, searchValue) {
  const query = normalizeSearchValue(searchValue);
  if (!query) {
    return [];
  }

  const expandedIds = [];

  function hasMatch(node) {
    const name = normalizeSearchValue(node.name || '');
    const slug = normalizeSearchValue(node.slug || '');
    const matches = name.includes(query) || slug.includes(query);
    const hasMatchingChild = (node.children || []).some((child) => hasMatch(child));

    if (hasMatchingChild) {
      expandedIds.push(node.id);
    }

    return matches || hasMatchingChild;
  }

  nodes.forEach((node) => hasMatch(node));
  return expandedIds;
}

function findCategoryPath(categoryId, nodes = categories.value, trail = []) {
  for (const node of nodes) {
    const nextTrail = [...trail, node.id];
    if (node.id === categoryId) {
      return nextTrail;
    }
    const childPath = findCategoryPath(categoryId, node.children || [], nextTrail);
    if (childPath.length > 0) {
      return childPath;
    }
  }

  return [];
}

function ensureActiveCategoryPathExpanded() {
  if (!activeCategoryId.value) {
    return;
  }

  const path = findCategoryPath(activeCategoryId.value);
  if (path.length === 0) {
    return;
  }

  const nextExpanded = new Set(expandedCategoryIds.value);
  path.forEach((id) => nextExpanded.add(id));
  expandedCategoryIds.value = nextExpanded;
}

function toggleCategoryNode(categoryId) {
  const nextExpanded = new Set(expandedCategoryIds.value);
  if (nextExpanded.has(categoryId)) {
    nextExpanded.delete(categoryId);
  } else {
    nextExpanded.add(categoryId);
  }
  expandedCategoryIds.value = nextExpanded;
}

async function handleCategorySelect(category) {
  closeUserMenu();
  await router.push({
    path: '/videos',
    query: { categoryId: String(category.id), autoSearch: '1' },
  });
}

async function clearCategoryFilter() {
  await router.push('/videos');
}

watch(activeCategoryId, () => {
  ensureActiveCategoryPathExpanded();
});

onMounted(async () => {
  document.addEventListener('click', handleDocumentClick);
  api.setAuthFailureHandler(() => {
    if (authToken.value) {
      logout('Session expired.', 'error');
      router.push('/auth');
    }
  });
  if (window.innerWidth <= 980) {
    isSidebarCollapsed.value = true;
  }

  await loadCategories();
  await loadVideos();

  if (localStorage.getItem('basicvids_access_token')) {
    try {
      currentUser.value = await api.currentUser();
    } catch (error) {
      logout();
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  api.setAuthFailureHandler(null);
  if (messageTimerId) {
    clearTimeout(messageTimerId);
  }
});
</script>
