import { createRouter, createWebHashHistory } from 'vue-router';
import AccountPage from './views/AccountPage.vue';
import CreateAccountPage from './views/CreateAccountPage.vue';
import LoginPage from './views/LoginPage.vue';
import RoadmapPage from './views/RoadmapPage.vue';
import VideosPage from './views/VideosPage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/videos' },
    { path: '/videos', name: 'videos', component: VideosPage },
    { path: '/account', name: 'account', component: AccountPage },
    { path: '/auth', name: 'auth', component: LoginPage },
    { path: '/create-account', name: 'create-account', component: CreateAccountPage },
    { path: '/roadmap', name: 'roadmap', component: RoadmapPage },
  ],
});
