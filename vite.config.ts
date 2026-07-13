import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// The deploy workflow injects the repository subpath used by GitHub Pages.
const base = process.env.BASE_PATH ?? '/';

function spaFallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const index = resolve(__dirname, 'dist/index.html');
      if (!existsSync(index)) return;

      copyFileSync(index, resolve(__dirname, 'dist/404.html'));

      // Public legal pages should return 200 on direct visits and refreshes.
      for (const route of ['privacy', 'terms']) {
        const routeDir = resolve(__dirname, 'dist', route);
        mkdirSync(routeDir, { recursive: true });
        copyFileSync(index, resolve(routeDir, 'index.html'));
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  build: { outDir: 'dist', sourcemap: false },
});
