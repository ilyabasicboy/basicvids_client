import { createRouter, createWebHashHistory } from 'vue-router';
import ConfirmEmailPage from './views/ConfirmEmailPage.vue';
import CreateAccountPage from './views/CreateAccountPage.vue';
import CurrentUserPage from './views/CurrentUserPage.vue';
import LoginPage from './views/LoginPage.vue';
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
    { path: '/user-videos', name: 'user-videos', component: UserVideosPage },
    { path: '/auth', name: 'auth', component: LoginPage },
    { path: '/create-account', name: 'create-account', component: CreateAccountPage },
    { path: '/confirm-email', name: 'confirm-email', component: ConfirmEmailPage },
    { path: '/current-user', name: 'current-user', component: CurrentUserPage },
  ],
});
