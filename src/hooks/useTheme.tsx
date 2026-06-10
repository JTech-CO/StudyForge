import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

const KEY = 'sf-theme';

function systemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && systemDark());
  document.documentElement.classList.toggle('dark', dark);
}

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* localStorage 접근 불가 시 기본값 */
  }
  return 'system';
}

function persist(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* no-op */
  }
}

interface ThemeContextValue {
  theme: Theme;
  /** system 을 실제 모드로 해석한 값 */
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  /** light → dark → system → light 순환 */
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [sysDark, setSysDark] = useState<boolean>(systemDark);

  // 테마 또는 시스템 설정 변경 시 html.dark 동기화
  useEffect(() => {
    applyTheme(theme);
  }, [theme, sysDark]);

  // 시스템 색상 변경 구독 (system 모드일 때 즉시 반영)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    persist(t);
    setThemeState(t);
  }, []);

  const cycle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      persist(next);
      return next;
    });
  }, []);

  const resolved: 'light' | 'dark' = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme, cycle }),
    [theme, resolved, setTheme, cycle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme 는 ThemeProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
