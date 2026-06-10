import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { useStore } from './lib/store';
import App from './App';
import './styles/global.css';

// 저장된 노트북 목록 로드 (IndexedDB)
void useStore.getState().loadNotebooks();

// Vite base('/' 또는 '/<repo>/')에서 라우터 basename 도출
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
