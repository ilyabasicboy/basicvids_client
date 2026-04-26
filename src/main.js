import { createApp } from 'vue';
import { defineCustomElements } from 'vidstack/elements';
import 'vidstack/styles/defaults.css';
import 'vidstack/styles/community-skin/video.css';
import App from './App.vue';
import { router } from './router';
import './styles.css';

async function bootstrap() {
  await defineCustomElements();

  const app = createApp(App);
  app.use(router).mount('#app');
}

bootstrap();
