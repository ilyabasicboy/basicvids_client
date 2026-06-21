import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const proxyTarget = 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('media-'),
        },
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': proxyTarget,
      '/health': proxyTarget,
      '/auth': proxyTarget,
      '/storage': proxyTarget,
    },
  },
});
