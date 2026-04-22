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
            :load-video="loadVideo"
            :load-comments="loadComments"
            :create-comment="createComment"
            :delete-comment="deleteComment"
            :upload-file="uploadFile"
            :video-thumbnail-url="videoThumbnailUrl"
            :video-url="videoUrl"
            :videos="videos"
            :videos-count="videosCount"
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { api } from './api';
import UserAvatar from './components/UserAvatar.vue';

const route = useRoute();
const router = useRouter();
const videos = ref([]);
const videosCount = ref(0);
const isLoadingVideos = ref(false);
const uploadFile = ref(null);
const isUploading = ref(false);
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
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
let messageTimerId = null;
let videosRequestId = 0;

const navItems = [
  { id: 'home', label: 'Home', shortLabel: 'H', status: 'Videos', to: '/videos', activePaths: ['/videos'] },
  { id: 'categories', label: 'Categories', shortLabel: 'C', status: 'Soon', to: null, activePaths: [] },
];

const isAuthenticated = computed(() => Boolean(authToken.value));
const userLabel = computed(() => currentUser.value?.username || currentUser.value?.email || 'Guest');
const currentUserText = computed(() => (currentUser.value ? JSON.stringify(currentUser.value, null, 2) : 'No signed-in user loaded.'));

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

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
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
    if (requestId !== videosRequestId) {
      return;
    }
    videos.value = response.videos || [];
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

async function loadVideo(videoId) {
  const cachedVideo = videos.value.find((video) => video.id === videoId);
  if (cachedVideo?.status === 'ready') {
    return cachedVideo;
  }

  const video = await api.getVideo(videoId);
  const existingIndex = videos.value.findIndex((item) => item.id === video.id);
  if (existingIndex >= 0) {
    videos.value = videos.value.map((item) => (item.id === video.id ? video : item));
  }
  return video;
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
  try {
    await api.uploadVideo(file, {
      title: upload?.title,
      description: upload?.description,
      thumbnail: upload?.thumbnail,
    });
    uploadFile.value = null;
    await loadVideos();
    await router.push('/videos');
    setMessage('Video uploaded. Processing started.', 'success');
  } catch (error) {
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

function videoThumbnailUrl(videoId) {
  return api.videoThumbnailUrl(videoId);
}

function avatarUrl(userId) {
  return `${api.userAvatarUrl(userId)}?v=${avatarVersion.value}`;
}

onMounted(async () => {
  document.addEventListener('click', handleDocumentClick);
  if (window.innerWidth <= 980) {
    isSidebarCollapsed.value = true;
  }

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
  if (messageTimerId) {
    clearTimeout(messageTimerId);
  }
});
</script>
