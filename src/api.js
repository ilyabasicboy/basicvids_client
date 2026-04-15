const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('basicvids_access_token');
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.detail ? data.detail : 'Request failed';
    throw new Error(message);
  }

  return data;
}

export const api = {
  baseUrl: API_BASE_URL || window.location.origin,

  health() {
    return request('/health');
  },

  login(identifier, password) {
    return request('/api/v1/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  currentUser() {
    return request('/api/v1/users/detail/');
  },

  listVideos() {
    return request('/api/v1/videos/');
  },

  uploadVideo(file) {
    const formData = new FormData();
    formData.append('file', file);

    return request('/api/v1/videos/upload/', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  videoUrl(videoId) {
    return `${API_BASE_URL}/api/v1/videos/${videoId}/download/`;
  },
};
