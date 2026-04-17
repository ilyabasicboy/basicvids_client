<template>
  <main class="app-shell">
    <section class="workspace">
      <aside class="sidebar" aria-label="BasicVids navigation">
        <div class="brand">
          <span class="brand-mark">BV</span>
          <div>
            <strong>BasicVids</strong>
            <span>Video hosting</span>
          </div>
        </div>

        <nav class="nav-list" aria-label="Sections">
          <RouterLink
            v-for="item in navItems"
            :key="item.id"
            :to="item.to"
            class="nav-item"
            :class="{ active: isNavActive(item) }"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.status }}</small>
          </RouterLink>
        </nav>

        <div class="gateway-box">
          <span>Gateway</span>
          <strong>{{ apiBaseUrl }}</strong>
          <small>{{ gatewayStatus }}</small>
        </div>
      </aside>

      <section class="content">
        <header class="topbar">
          <div>
            <p class="eyebrow">Workspace</p>
            <h1>Manage videos, access, and service routes.</h1>
          </div>
          <div class="user-strip">
            <span>{{ userLabel }}</span>
            <button v-if="isAuthenticated" type="button" @click="logout()">Log out</button>
          </div>
        </header>

        <section class="hero-panel" aria-label="Current video workspace">
          <img
            class="hero-image"
            src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=80"
            alt="Camera and production monitor"
          />
          <div class="hero-overlay">
            <p>Library</p>
            <h2>{{ videos.length }} videos connected</h2>
          </div>
        </section>

        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            :current-user="currentUser"
            :current-user-text="currentUserText"
            :format-bytes="formatBytes"
            :future-services="futureServices"
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

const route = useRoute();
const router = useRouter();
const gatewayStatus = ref('Checking...');
const authStatus = ref('Checking...');
const storageStatus = ref('Checking...');
const videos = ref([]);
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
const authToken = ref(localStorage.getItem('basicvids_access_token'));
const pendingConfirmCredentials = ref(null);
const message = ref('');
const messageType = ref('info');
let messageTimerId = null;

const navItems = [
  { id: 'videos', label: 'Videos', status: 'Storage', to: '/videos', activePaths: ['/videos'] },
  { id: 'account', label: 'Account', status: 'Auth', to: '/account', activePaths: ['/account', '/auth', '/create-account', '/confirm-email', '/current-user'] },
  { id: 'future', label: 'Roadmap', status: 'Next', to: '/roadmap', activePaths: ['/roadmap'] },
];

const futureServices = [
  {
    name: 'Comments',
    route: '/api/v1/comments/',
    note: 'Thread and moderation service',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Payments',
    route: '/api/v1/payments/',
    note: 'Subscriptions and invoices',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
  },
];

const apiBaseUrl = computed(() => api.baseUrl);
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
  return item.activePaths.some((path) => route.path === path || route.path.startsWith(`${path}/`));
}

async function loadHealth() {
  try {
    await api.health();
    gatewayStatus.value = 'Online';
  } catch (error) {
    gatewayStatus.value = 'Offline';
  }

  try {
    const response = await fetch(`${api.baseUrl}/auth/health`);
    if (!response.ok) {
      throw new Error('Auth health check failed');
    }
    authStatus.value = 'Online';
  } catch (error) {
    authStatus.value = 'Offline';
  }

  try {
    const response = await fetch(`${api.baseUrl}/storage/health`);
    if (!response.ok) {
      throw new Error('Storage health check failed');
    }
    storageStatus.value = 'Online';
  } catch (error) {
    storageStatus.value = 'Offline';
  }
}

async function loadVideos() {
  isLoadingVideos.value = true;
  try {
    const response = await api.listVideos();
    videos.value = response.videos || [];
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isLoadingVideos.value = false;
  }
}

async function loadVideo(videoId) {
  const cachedVideo = videos.value.find((video) => video.id === videoId);
  if (cachedVideo) {
    return cachedVideo;
  }

  return api.getVideo(videoId);
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
    await router.push('/account');
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

    pendingConfirmCredentials.value = {
      identifier: account.username,
      password: account.password,
    };
    await router.push({ path: '/confirm-email', query: { email: createdUser.email } });
    setMessage('Account created. Confirm your email to sign in.', 'success');
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
      await router.push('/account');
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
    await api.deleteCurrentUser();
    logout('Account deleted.', 'success');
    await router.push('/account');
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
  setMessage(typeof text === 'string' ? text : 'Signed out.', type);
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
    setMessage('Video uploaded.', 'success');
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

function videoUrl(videoId) {
  return api.videoUrl(videoId);
}

function videoThumbnailUrl(videoId) {
  return api.videoThumbnailUrl(videoId);
}

onMounted(async () => {
  await Promise.all([loadHealth(), loadVideos()]);

  if (localStorage.getItem('basicvids_access_token')) {
    try {
      currentUser.value = await api.currentUser();
    } catch (error) {
      logout();
    }
  }
});

onUnmounted(() => {
  if (messageTimerId) {
    clearTimeout(messageTimerId);
  }
});
</script>
