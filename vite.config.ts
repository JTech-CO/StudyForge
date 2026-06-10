import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// GitHub Pages 프로젝트 사이트는 https://<user>.github.io/<repo>/ 하위에서 서빙된다.
// 배포 워크플로(.github/workflows/deploy.yml)가 BASE_PATH 를 주입한다. 기본값은 '/'.
const base = process.env.BASE_PATH ?? '/';

// SPA 딥링크(/share/:id, /notebook/:id)가 GitHub Pages 정적 호스팅에서
// 404 되지 않도록, 빌드 후 index.html 을 404.html 로 복사한다.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const index = resolve(__dirname, 'dist/index.html');
      if (existsSync(index)) copyFileSync(index, resolve(__dirname, 'dist/404.html'));
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  build: { outDir: 'dist', sourcemap: false },
});
