import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Drawer } from './components/layout/Drawer';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { useTheme, type Theme } from './hooks/useTheme';
import { useApiKey } from './hooks/useApiKey';
import { useT } from './hooks/useT';
import { useStore } from './lib/store';
import { GEMINI_MODEL_OPTIONS } from './lib/ai/models';
import type { Locale } from './lib/ai/provider';
import Home from './pages/Home';
import Notebook from './pages/Notebook';

const THEME_OPTIONS: { id: Theme; key: string }[] = [
  { id: 'light', key: 'theme.light' },
  { id: 'dark', key: 'theme.dark' },
  { id: 'system', key: 'theme.system' },
];

const LOCALE_OPTIONS: { id: Locale; label: string }[] = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
];

const RADIO_SPAN =
  'flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors duration-100 hover:bg-surface-2 peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';

function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const { apiKey, setApiKey } = useApiKey();
  const { t } = useT();
  const locale = useStore((s) => s.settings.locale);
  const setLocale = useStore((s) => s.setLocale);
  const model = useStore((s) => s.settings.model);
  const setModel = useStore((s) => s.setModel);
  const [showKey, setShowKey] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title={t('settings.title')}>
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">{t('settings.theme')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((o) => (
              <label key={o.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="settings-theme"
                  checked={theme === o.id}
                  onChange={() => setTheme(o.id)}
                  className="peer sr-only"
                />
                <span className={RADIO_SPAN}>{t(o.key)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">{t('settings.language')}</legend>
          <div className="grid grid-cols-2 gap-2">
            {LOCALE_OPTIONS.map((o) => (
              <label key={o.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="settings-locale"
                  checked={locale === o.id}
                  onChange={() => setLocale(o.id)}
                  className="peer sr-only"
                />
                <span className={RADIO_SPAN}>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="flex flex-col gap-2">
          <label htmlFor="api-key" className="text-sm font-medium text-fg">
            {t('settings.apiKey')}
          </label>
          <div className="flex gap-2">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-accent"
            />
            <Button variant="ghost" type="button" onClick={() => setShowKey((v) => !v)} aria-pressed={showKey}>
              {showKey ? t('settings.hide') : t('settings.show')}
            </Button>
          </div>
          <p className="text-xs text-muted">
            {t('settings.keyNotice')}{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-2"
            >
              {t('settings.getKey')}
            </a>
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <label htmlFor="gemini-model" className="text-sm font-medium text-fg">
            {t('settings.model')}
          </label>
          <select
            id="gemini-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus-visible:border-accent"
          >
            {GEMINI_MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">{t('settings.modelNote')}</p>
        </section>
      </div>
    </Modal>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.tagline')}</p>
        <p>v0.1.0</p>
      </div>
    </footer>
  );
}

/** 메인 앱 셸 (헤더 + 사이드바/드로어 + 본문 + 푸터) */
function Shell() {
  const { t } = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:border focus:border-border focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-fg"
      >
        {t('skip.toContent')}
      </a>

      <Header onMenuClick={() => setDrawerOpen(true)} onSettingsClick={() => setSettingsOpen(true)} />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />
        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <Footer />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

/** 구버전 공유 URL(`/share/:id`) → 통합 라우트(`/notebook/:id`)로 리다이렉트(M5 링크 호환). */
function ShareRedirect() {
  const { id } = useParams();
  return <Navigate to={`/notebook/${id ?? ''}`} replace />;
}

function NotFound() {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="text-2xl font-bold text-fg">{t('notFound.title')}</h1>
      <Link to="/" className="text-accent underline underline-offset-2">
        {t('common.home')}
      </Link>
    </div>
  );
}

export default function App() {
  const { locale } = useT();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/notebook/:id" element={<Notebook />} />
      </Route>
      <Route path="/share/:id" element={<ShareRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
