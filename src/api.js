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

  uploadRegistrationAvatar(userId, avatar) {
    const formData = new FormData();
    formData.append('avatar', avatar);

    return request(`/api/v1/avatars/users/${userId}/registration/`, {
      method: 'POST',
      body: formData,
      headers: {},
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

  uploadCurrentUserAvatar(avatar) {
    const formData = new FormData();
    formData.append('avatar', avatar);

    return request('/api/v1/avatars/me/', {
      method: 'PUT',
      body: formData,
      headers: {},
    });
  },

  deleteCurrentUserAvatar() {
    return request('/api/v1/avatars/me/', {
      method: 'DELETE',
    });
  },

  changePassword(passwords) {
    return request('/api/v1/users/change/password/', {
      method: 'PATCH',
      body: JSON.stringify(passwords),
    });
  },

  deleteCurrentUser() {
    return request('/api/v1/users/delete/', {
      method: 'DELETE',
    });
  },

  listVideos({ search = '', offset = 0, limit = 30, authorId = null } = {}) {
    const params = new URLSearchParams();
    const cleanSearch = search.trim();

    if (cleanSearch) {
      params.set('search', cleanSearch);
    }
    if (authorId) {
      params.set('author_id', String(authorId));
    }
    params.set('offset', String(offset));
    params.set('limit', String(limit));

    const queryString = params.toString();
    return request(`/api/v1/videos/${queryString ? `?${queryString}` : ''}`);
  },

  getVideo(videoId) {
    return request(`/api/v1/videos/${videoId}`);
  },

  uploadVideo(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title || file.name);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.thumbnail) {
      formData.append('thumbnail', metadata.thumbnail);
    }

    return request('/api/v1/videos/upload/', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  changeVideo(videoId, metadata) {
    return request(`/api/v1/videos/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  },

  deleteVideo(videoId) {
    return request(`/api/v1/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  listComments(videoId) {
    const params = new URLSearchParams({ video_id: videoId });
    return request(`/api/v1/comments/?${params.toString()}`);
  },

  createComment(videoId, text) {
    return request('/api/v1/comments/', {
      method: 'POST',
      body: JSON.stringify({ video_id: videoId, text }),
    });
  },

  deleteComment(commentId) {
    return request(`/api/v1/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  videoUrl(videoId, quality = null) {
    const params = new URLSearchParams();
    if (quality) {
      params.set('quality', String(quality));
    }

    const queryString = params.toString();
    return `${API_BASE_URL}/api/v1/videos/${videoId}/download/${queryString ? `?${queryString}` : ''}`;
  },

  videoThumbnailUrl(videoId) {
    return `${API_BASE_URL}/api/v1/videos/${videoId}/thumbnail/`;
  },

  userAvatarUrl(userId) {
    return `${API_BASE_URL}/api/v1/avatars/users/${userId}/image/`;
  },
};
