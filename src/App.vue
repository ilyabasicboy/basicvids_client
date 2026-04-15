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
          <button
            v-for="item in navItems"
            :key="item.id"
            class="nav-item"
            :class="{ active: activeSection === item.id }"
            type="button"
            @click="activeSection = item.id"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.status }}</small>
          </button>
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

        <section v-if="activeSection === 'videos'" class="main-grid">
          <article class="panel upload-panel">
            <div class="panel-heading">
              <p class="eyebrow">Storage</p>
              <h2>Upload video</h2>
            </div>

            <label
              class="dropzone"
              :class="{ selected: uploadFile }"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <input type="file" accept="video/*" @change="onFileSelect" />
              <span>{{ uploadFile ? uploadFile.name : 'Choose or drop a video file' }}</span>
              <small>{{ uploadFile ? formatBytes(uploadFile.size) : 'Stored by the storage microservice' }}</small>
            </label>

            <button class="primary-button" type="button" :disabled="!uploadFile || isUploading" @click="uploadSelectedVideo">
              {{ isUploading ? 'Uploading...' : 'Upload video' }}
            </button>
          </article>

          <article class="panel library-panel">
            <div class="panel-heading inline">
              <div>
                <p class="eyebrow">Videos</p>
                <h2>Library</h2>
              </div>
              <button type="button" class="ghost-button" @click="loadVideos">Refresh</button>
            </div>

            <div v-if="isLoadingVideos" class="empty-state">Loading videos...</div>
            <div v-else-if="videos.length === 0" class="empty-state">No videos uploaded yet.</div>
            <ul v-else class="video-list">
              <li v-for="video in videos" :key="video.id" class="video-item">
                <div class="video-thumb">
                  <span>{{ getInitial(video.original_filename) }}</span>
                </div>
                <div>
                  <strong>{{ video.original_filename }}</strong>
                  <small>{{ formatBytes(video.size_bytes) }} · {{ video.content_type || 'video' }}</small>
                </div>
                <a :href="api.videoUrl(video.id)" target="_blank" rel="noreferrer">Open</a>
              </li>
            </ul>
          </article>
        </section>

        <section v-if="activeSection === 'account'" class="main-grid">
          <article class="panel">
            <div class="panel-heading">
              <p class="eyebrow">Auth</p>
              <h2>Sign in</h2>
            </div>

            <form class="auth-form" @submit.prevent="login">
              <label>
                <span>Username or email</span>
                <input v-model="credentials.identifier" type="text" autocomplete="username" />
              </label>
              <label>
                <span>Password</span>
                <input v-model="credentials.password" type="password" autocomplete="current-password" />
              </label>
              <button class="primary-button" type="submit" :disabled="isSigningIn">
                {{ isSigningIn ? 'Signing in...' : 'Sign in' }}
              </button>
            </form>
          </article>

          <article class="panel profile-panel">
            <div class="panel-heading">
              <p class="eyebrow">User</p>
              <h2>Current access</h2>
            </div>
            <pre>{{ currentUserText }}</pre>
          </article>
        </section>

        <section v-if="activeSection === 'future'" class="future-section">
          <article v-for="service in futureServices" :key="service.name" class="future-item">
            <img :src="service.image" :alt="service.name" />
            <div>
              <span>{{ service.name }}</span>
              <strong>{{ service.route }}</strong>
              <small>{{ service.note }}</small>
            </div>
          </article>
        </section>

        <p v-if="message" class="message" :class="messageType">{{ message }}</p>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from './api';

const activeSection = ref('videos');
const gatewayStatus = ref('Checking...');
const authStatus = ref('Checking...');
const storageStatus = ref('Checking...');
const videos = ref([]);
const isLoadingVideos = ref(false);
const uploadFile = ref(null);
const isUploading = ref(false);
const isSigningIn = ref(false);
const currentUser = ref(null);
const message = ref('');
const messageType = ref('info');

const credentials = reactive({
  identifier: '',
  password: '',
});

const navItems = [
  { id: 'videos', label: 'Videos', status: 'Storage' },
  { id: 'account', label: 'Account', status: 'Auth' },
  { id: 'future', label: 'Roadmap', status: 'Next' },
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
const isAuthenticated = computed(() => Boolean(localStorage.getItem('basicvids_access_token')));
const userLabel = computed(() => currentUser.value?.username || currentUser.value?.email || 'Guest');
const currentUserText = computed(() => (currentUser.value ? JSON.stringify(currentUser.value, null, 2) : 'No signed-in user loaded.'));

function setMessage(text, type = 'info') {
  message.value = text;
  messageType.value = type;
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

async function login() {
  isSigningIn.value = true;
  try {
    const response = await api.login(credentials.identifier, credentials.password);
    localStorage.setItem('basicvids_access_token', response.access_token);
    localStorage.setItem('basicvids_refresh_token', response.refresh_token);
    currentUser.value = await api.currentUser();
    setMessage('Signed in.', 'success');
  } catch (error) {
    setMessage(error.message, 'error');
  } finally {
    isSigningIn.value = false;
  }
}

function logout() {
  localStorage.removeItem('basicvids_access_token');
  localStorage.removeItem('basicvids_refresh_token');
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
