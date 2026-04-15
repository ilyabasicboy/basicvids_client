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
            <button v-if="isAuthenticated" type="button" @click="logout">Log out</button>
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

        <section class="service-grid">
          <article class="service-card">
            <span>Auth</span>
            <strong>{{ authStatus }}</strong>
            <small>/api/v1/auth and /api/v1/users</small>
          </article>
          <article class="service-card">
            <span>Storage</span>
            <strong>{{ storageStatus }}</strong>
            <small>/api/v1/videos</small>
          </article>
          <article class="service-card muted">
            <span>Next</span>
            <strong>Comments</strong>
            <small>Ready for a new gateway route</small>
          </article>
          <article class="service-card muted">
            <span>Next</span>
            <strong>Payments</strong>
            <small>Ready for a new gateway route</small>
          </article>
        </section>

        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            :current-user="currentUser"
            :current-user-text="currentUserText"
            :format-bytes="formatBytes"
            :future-services="futureServices"
            :get-initial="getInitial"
            :is-authenticated="isAuthenticated"
            :is-creating-account="isCreatingAccount"
            :is-loading-videos="isLoadingVideos"
            :is-signing-in="isSigningIn"
            :is-uploading="isUploading"
            :upload-file="uploadFile"
            :video-url="videoUrl"
            :videos="videos"
            @create-account="createAccount"
            @drop-video="onDrop"
            @load-videos="loadVideos"
            @login="login"
            @select-video="onFileSelect"
            @upload-video="uploadSelectedVideo"
          />
        </RouterView>

        <p v-if="message" class="message" :class="messageType">{{ message }}</p>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
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
const isCreatingAccount = ref(false);
const isSigningIn = ref(false);
const currentUser = ref(null);
const authToken = ref(localStorage.getItem('basicvids_access_token'));
const message = ref('');
const messageType = ref('info');

const navItems = [
  { id: 'videos', label: 'Videos', status: 'Storage', to: '/videos', activePaths: ['/videos'] },
  { id: 'account', label: 'Account', status: 'Auth', to: '/account', activePaths: ['/account', '/auth', '/create-account', '/current-user'] },
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
    name: 'Descriptions',
    route: '/api/v1/descriptions/',
    note: 'Metadata and text enrichment',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
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
}

function isNavActive(item) {
  return item.activePaths.includes(route.path);
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

async function login(credentials) {
  isSigningIn.value = true;
  try {
    const response = await api.login(credentials.identifier, credentials.password);
    await applyAuthResponse(response);
    await router.push('/account');
    setMessage('Signed in.', 'success');
  } catch (error) {
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
    await api.createAccount({
      username: account.username,
      first_name: account.firstName || null,
      last_name: account.lastName || null,
      email: account.email,
      password: account.password,
    });

    const loginResponse = await api.login(account.username, account.password);
    await applyAuthResponse(loginResponse);
    await router.push('/account');
    setMessage('Account created.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isCreatingAccount.value = false;
  }
}

function logout() {
  localStorage.removeItem('basicvids_access_token');
  localStorage.removeItem('basicvids_refresh_token');
  authToken.value = null;
  currentUser.value = null;
  setMessage('Signed out.', 'info');
}

function onFileSelect(event) {
  uploadFile.value = event.target.files?.[0] || null;
}

function onDrop(event) {
  uploadFile.value = event.dataTransfer.files?.[0] || null;
}

async function uploadSelectedVideo() {
  if (!uploadFile.value) {
    return;
  }

  isUploading.value = true;
  try {
    await api.uploadVideo(uploadFile.value);
    uploadFile.value = null;
    await loadVideos();
    setMessage('Video uploaded.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isUploading.value = false;
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
</script>
