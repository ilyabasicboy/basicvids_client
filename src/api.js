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
  const hasNoBody = response.status === 204 || response.status === 205;
  const bodyText = hasNoBody ? '' : await response.text();
  const data = contentType.includes('application/json') && bodyText ? JSON.parse(bodyText) : bodyText;

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

  listVideos({
    search = '',
    offset = 0,
    limit = 30,
    authorId = null,
    categoryId = null,
    categoryIds = [],
    includeSubcategories = true,
    duration = '',
    uploaded = '',
  } = {}) {
    const params = new URLSearchParams();
    const cleanSearch = search.trim();

    if (cleanSearch) {
      params.set('search', cleanSearch);
    }
    if (authorId) {
      params.set('author_id', String(authorId));
    }
    const selectedCategoryIds = categoryIds.length > 0 ? categoryIds : (categoryId ? [categoryId] : []);
    selectedCategoryIds.forEach((selectedCategoryId) => {
      params.append('category_id', String(selectedCategoryId));
    });
    if (selectedCategoryIds.length > 0) {
      params.set('include_subcategories', String(includeSubcategories));
    }
    if (duration) {
      params.set('duration', duration);
    }
    if (uploaded) {
      params.set('uploaded', uploaded);
    }
    params.set('offset', String(offset));
    params.set('limit', String(limit));

    const queryString = params.toString();
    return request(`/api/v1/videos/${queryString ? `?${queryString}` : ''}`);
  },

  getVideo(videoId) {
    return request(`/api/v1/videos/${videoId}`);
  },

  listCategories() {
    return request('/api/v1/categories/');
  },

  createCategory(payload) {
    return request('/api/v1/categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteCategory(categoryId) {
    return request(`/api/v1/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  createVideoUploadSession(payload) {
    return request('/api/v1/videos/uploads/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getVideoUploadSession(uploadId) {
    return request(`/api/v1/videos/uploads/${uploadId}`);
  },

  uploadVideoChunk(uploadId, chunkIndex, chunk) {
    return request(`/api/v1/videos/uploads/${uploadId}/chunks/${chunkIndex}`, {
      method: 'PUT',
      body: chunk,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  },

  completeVideoUploadSession(uploadId) {
    return request(`/api/v1/videos/uploads/${uploadId}/complete/`, {
      method: 'POST',
    });
  },

  deleteVideoUploadSession(uploadId) {
    return request(`/api/v1/videos/uploads/${uploadId}`, {
      method: 'DELETE',
    });
  },

  uploadVideoThumbnail(videoId, thumbnail) {
    const formData = new FormData();
    formData.append('thumbnail', thumbnail);

    return request(`/api/v1/videos/${videoId}/thumbnail/`, {
      method: 'PUT',
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

  getVideoEngagement(videoId) {
    return request(`/api/v1/engagement/videos/${videoId}`);
  },

  getVideoEngagementSummaries(videoIds) {
    return request('/api/v1/engagement/videos/summaries', {
      method: 'POST',
      body: JSON.stringify({ video_ids: videoIds }),
    });
  },

  setVideoReaction(videoId, reaction) {
    return request(`/api/v1/engagement/videos/${videoId}/reaction`, {
      method: 'PUT',
      body: JSON.stringify({ reaction }),
    });
  },

  registerVideoView(videoId, watchedSeconds = null) {
    return request(`/api/v1/engagement/videos/${videoId}/view`, {
      method: 'POST',
      body: JSON.stringify({ watched_seconds: watchedSeconds }),
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

  videoHlsUrl(videoId) {
    return `${API_BASE_URL}/api/v1/videos/${videoId}/hls/master.m3u8`;
  },

  videoThumbnailUrl(videoId) {
    return `${API_BASE_URL}/api/v1/videos/${videoId}/thumbnail/`;
  },

  userAvatarUrl(userId) {
    return `${API_BASE_URL}/api/v1/avatars/users/${userId}/image/`;
  },
};
