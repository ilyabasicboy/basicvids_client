import { createRouter, createWebHashHistory } from 'vue-router';
import AccountPage from './views/AccountPage.vue';
import CreateAccountPage from './views/CreateAccountPage.vue';
import CurrentUserPage from './views/CurrentUserPage.vue';
import LoginPage from './views/LoginPage.vue';
import RoadmapPage from './views/RoadmapPage.vue';
import VideoPlayerPage from './views/VideoPlayerPage.vue';
import VideosPage from './views/VideosPage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/videos' },
    { path: '/videos', name: 'videos', component: VideosPage },
    { path: '/videos/:videoId', name: 'video-player', component: VideoPlayerPage },
    { path: '/account', name: 'account', component: AccountPage },
    { path: '/auth', name: 'auth', component: LoginPage },
    { path: '/create-account', name: 'create-account', component: CreateAccountPage },
    { path: '/current-user', name: 'current-user', component: CurrentUserPage },
    { path: '/roadmap', name: 'roadmap', component: RoadmapPage },
  ],
});
