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
    let message = 'Request failed';

    if (typeof data === 'object' && data?.detail) {
      message = Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg || item.detail || 'Validation error').join('. ')
        : data.detail;
    }

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

  createAccount(account) {
    return request('/api/v1/users/create/', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  },

  confirmEmail(data) {
    return request('/api/v1/users/confirm/email/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  currentUser() {
    return request('/api/v1/users/detail/');
  },

  changeUser(user) {
    return request('/api/v1/users/change/', {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
  },

  changePassword(passwords) {
    return request('/api/v1/users/change/password/', {
      method: 'PATCH',
      body: JSON.stringify(passwords),
    });
  },

  listVideos() {
    return request('/api/v1/videos/');
  },

  getVideo(videoId) {
    return request(`/api/v1/videos/${videoId}`);
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

  deleteVideo(videoId) {
    return request(`/api/v1/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  videoUrl(videoId) {
    return `${API_BASE_URL}/api/v1/videos/${videoId}/download/`;
  },
};
