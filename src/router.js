import { createRouter, createWebHashHistory } from 'vue-router';
import ConfirmEmailPage from './views/ConfirmEmailPage.vue';
import CategoriesPage from './views/CategoriesPage.vue';
import ChannelFormPage from './views/ChannelFormPage.vue';
import ChannelPage from './views/ChannelPage.vue';
import ChannelPlaylistFormPage from './views/ChannelPlaylistFormPage.vue';
import ChannelPlaylistsPage from './views/ChannelPlaylistsPage.vue';
import ChannelUploadVideoPage from './views/ChannelUploadVideoPage.vue';
import ChannelVideosPage from './views/ChannelVideosPage.vue';
import CreateAccountPage from './views/CreateAccountPage.vue';
import CurrentUserPage from './views/CurrentUserPage.vue';
import LoginPage from './views/LoginPage.vue';
import UserChannelsPage from './views/UserChannelsPage.vue';
import WatchHistoryPage from './views/WatchHistoryPage.vue';
import UploadVideoPage from './views/UploadVideoPage.vue';
import UserVideosPage from './views/UserVideosPage.vue';
import VideoPlayerPage from './views/VideoPlayerPage.vue';
import VideosPage from './views/VideosPage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/videos' },
    { path: '/videos', name: 'videos', component: VideosPage },
    { path: '/videos/upload', name: 'upload-video', component: UploadVideoPage },
    { path: '/videos/:videoId', name: 'video-player', component: VideoPlayerPage },
    { path: '/categories', name: 'categories', component: CategoriesPage },
    { path: '/channels', name: 'channels', component: UserChannelsPage },
    { path: '/channels/create', name: 'create-channel', component: ChannelFormPage },
    { path: '/channels/:channelId', name: 'channel', component: ChannelPage },
    { path: '/channels/:channelId/edit', name: 'edit-channel', component: ChannelFormPage },
    { path: '/channels/:channelId/upload', name: 'channel-upload-video', component: ChannelUploadVideoPage },
    { path: '/channels/:channelId/videos', name: 'channel-videos', component: ChannelVideosPage },
    { path: '/channels/:channelId/playlists', name: 'channel-playlists', component: ChannelPlaylistsPage },
    { path: '/channels/:channelId/playlists/create', name: 'create-channel-playlist', component: ChannelPlaylistFormPage },
    { path: '/channels/:channelId/playlists/:playlistId/edit', name: 'edit-channel-playlist', component: ChannelPlaylistFormPage },
    { path: '/user-videos', name: 'user-videos', component: UserVideosPage },
    { path: '/watch-history', name: 'watch-history', component: WatchHistoryPage },
    { path: '/auth', name: 'auth', component: LoginPage },
    { path: '/create-account', name: 'create-account', component: CreateAccountPage },
    { path: '/confirm-email', name: 'confirm-email', component: ConfirmEmailPage },
    { path: '/current-user', name: 'current-user', component: CurrentUserPage },
  ],
});
