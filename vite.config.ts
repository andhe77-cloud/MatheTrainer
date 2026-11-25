import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function resolveBasePath(): string {
  const explicit = process.env.VITE_BASE_PATH;
  if (explicit) {
    return explicit.endsWith('/') ? explicit : `${explicit}/`;
  }
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const [owner = '', repo = ''] = process.env.GITHUB_REPOSITORY.split('/');
    if (repo && repo.toLowerCase() !== `${owner.toLowerCase()}.github.io`) {
      return `/${repo}/`;
    }
  }
  return '/';
}

export default defineConfig(() => {
  const base = resolveBasePath();
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: base,
          name: 'Klötzchen-Abenteuer',
          short_name: 'Klötzchen',
          description: 'Mathe-Lernspiel für die 2. Klasse (Bayern) mit Handschrifteingabe und hüpfendem Tiergefährten.',
          theme_color: '#2563EB',
          background_color: '#F4F6F9',
          display: 'fullscreen',
          orientation: 'any',
          start_url: base,
          scope: base,
          lang: 'de',
          icons: [
            {
              src: `${base}pwa-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}pwa-maskable-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,webmanifest}'],
          globIgnores: ['assets/aistudio/**', 'src/**'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /\/assets\/stickers\/.*\.gif$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'sticker-gifs-v1',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      {
        name: 'prepare-github-pages-dist',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) {
            return;
          }
          const indexHtml = path.join(distDir, 'index.html');
          const fallback404 = path.join(distDir, '404.html');
          if (fs.existsSync(indexHtml)) {
            fs.copyFileSync(indexHtml, fallback404);
          }
          fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
