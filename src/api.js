const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const REFRESH_PATH = '/api/v1/auth/refresh/';
let refreshPromise = null;
let authFailureHandler = null;
let authRefreshHandler = null;

function getAccessToken() {
  return localStorage.getItem('basicvids_access_token');
}

function setAuthTokens(accessToken) {
  localStorage.setItem('basicvids_access_token', accessToken);
  localStorage.removeItem('basicvids_refresh_token');
}

function clearAuthTokens() {
  localStorage.removeItem('basicvids_access_token');
  localStorage.removeItem('basicvids_refresh_token');
}

function setAuthFailureHandler(handler) {
  authFailureHandler = typeof handler === 'function' ? handler : null;
}

function setAuthRefreshHandler(handler) {
  authRefreshHandler = typeof handler === 'function' ? handler : null;
}

function buildHeaders(options = {}, token = getAccessToken()) {
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const hasNoBody = response.status === 204 || response.status === 205;
  const bodyText = hasNoBody ? '' : await response.text();
  const data = contentType.includes('application/json') && bodyText ? JSON.parse(bodyText) : bodyText;
  return { contentType, data };
}

function buildRequestError(data) {
  let message = 'Request failed';

  if (typeof data === 'object' && data?.detail) {
    message = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg || item.detail || 'Validation error').join('. ')
      : data.detail;
  }

  return new Error(message);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const { data } = await parseResponse(response);

      if (!response.ok) {
        clearAuthTokens();
        if (authFailureHandler) {
          authFailureHandler();
        }
        throw buildRequestError(data);
      }

      setAuthTokens(data.access_token);
      if (authRefreshHandler) {
        authRefreshHandler(data);
      }
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request(path, options = {}, allowRefresh = true) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: buildHeaders(options),
  });
  const { data } = await parseResponse(response);

  if (
    response.status === 401
    && allowRefresh
    && path !== REFRESH_PATH
    && getAccessToken()
  ) {
    await refreshAccessToken();
    return request(path, options, false);
  }

  if (!response.ok) {
    throw buildRequestError(data);
  }

  return data;
}

export const api = {
  baseUrl: API_BASE_URL || window.location.origin,
  setAuthFailureHandler,
  setAuthRefreshHandler,

  health() {
    return request('/health');
  },

  login(identifier, password) {
    return request('/api/v1/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  refresh() {
    return refreshAccessToken();
  },

  logout() {
    return request('/api/v1/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({}),
    }, false);
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

  listMyChannels() {
    return request('/api/v1/channels/me/');
  },

  listChannels({ search = '', page = 1, pageSize = 50 } = {}) {
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    params.set('page', String(page));
    params.set('page_size', String(pageSize));

    return request(`/api/v1/channels/?${params.toString()}`);
  },

  createChannel(payload) {
    return request('/api/v1/channels/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getChannel(channelId) {
    return request(`/api/v1/channels/${channelId}`);
  },

  changeChannel(channelId, payload) {
    return request(`/api/v1/channels/${channelId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteChannel(channelId) {
    return request(`/api/v1/channels/${channelId}`, {
      method: 'DELETE',
    });
  },

  listMyChannelSubscriptions() {
    return request('/api/v1/channels/subscriptions/me/');
  },

  subscribeToChannel(channelId) {
    return request(`/api/v1/channels/${channelId}/subscriptions/`, {
      method: 'POST',
    });
  },

  unsubscribeFromChannel(channelId) {
    return request(`/api/v1/channels/${channelId}/subscriptions/`, {
      method: 'DELETE',
    });
  },

  listChannelVideos(channelId) {
    return request(`/api/v1/channels/${channelId}/videos/`);
  },

  getVideoChannel(videoId) {
    return request(`/api/v1/channels/videos/${videoId}/channel`);
  },

  getVideoChannels(videoIds) {
    return request('/api/v1/channels/videos/channels', {
      method: 'POST',
      body: JSON.stringify({ video_ids: videoIds }),
    });
  },

  addVideoToChannel(channelId, videoId) {
    return request(`/api/v1/channels/${channelId}/videos/${videoId}`, {
      method: 'POST',
    });
  },

  removeVideoFromChannel(channelId, videoId) {
    return request(`/api/v1/channels/${channelId}/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  listChannelPlaylists(channelId) {
    return request(`/api/v1/channels/${channelId}/playlists/`);
  },

  createChannelPlaylist(channelId, payload) {
    return request(`/api/v1/channels/${channelId}/playlists/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getChannelPlaylist(channelId, playlistId) {
    return request(`/api/v1/channels/${channelId}/playlists/${playlistId}`);
  },

  changeChannelPlaylist(channelId, playlistId, payload) {
    return request(`/api/v1/channels/${channelId}/playlists/${playlistId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteChannelPlaylist(channelId, playlistId) {
    return request(`/api/v1/channels/${channelId}/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  },

  addVideoToChannelPlaylist(channelId, playlistId, videoId) {
    return request(`/api/v1/channels/${channelId}/playlists/${playlistId}/videos/${videoId}`, {
      method: 'POST',
    });
  },

  changeChannelPlaylistVideoPosition(channelId, playlistId, videoId, position) {
    return request(`/api/v1/channels/${channelId}/playlists/${playlistId}/videos/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    });
  },

  removeVideoFromChannelPlaylist(channelId, playlistId, videoId) {
    return request(`/api/v1/channels/${channelId}/playlists/${playlistId}/videos/${videoId}`, {
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

  upsertVideoHistory(videoId, payload) {
    return request(`/api/v1/history/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  listVideoHistory({ offset = 0, limit = 20 } = {}) {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    return request(`/api/v1/history/videos/?${params.toString()}`);
  },

  getVideoHistory(videoId) {
    return request(`/api/v1/history/videos/${videoId}`);
  },

  deleteVideoHistory(videoId) {
    return request(`/api/v1/history/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  clearVideoHistory() {
    return request('/api/v1/history/videos/', {
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
