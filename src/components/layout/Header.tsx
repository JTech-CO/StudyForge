import { Link } from 'react-router-dom';
import { useTheme, type Theme } from '../../hooks/useTheme';
import { useStore } from '../../lib/store';
import { useT } from '../../hooks/useT';
import { Globe, Mark, Menu, Monitor, Moon, Settings, Sun } from '../ui/icons';

interface HeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const THEME_KEY: Record<Theme, string> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
};

export function Header({ onMenuClick, onSettingsClick }: HeaderProps) {
  const { theme, cycle } = useTheme();
  const { t, locale } = useT();
  const setLocale = useStore((s) => s.setLocale);
  const ThemeIcon = THEME_ICON[theme];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label={t('header.menuOpen')}
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg transition-colors duration-100 hover:bg-surface-2 md:hidden"
          >
            <Menu />
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-1 py-1 font-semibold text-fg"
          >
            <span className="text-accent" aria-hidden="true">
              <Mark />
            </span>
            <span>StudyForge</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
            aria-label={t('header.language')}
            title={locale === 'ko' ? 'EN' : '한국어'}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium text-fg transition-colors duration-100 hover:bg-surface-2"
          >
            <Globe size={16} />
            <span className="text-xs">{locale === 'ko' ? 'KO' : 'EN'}</span>
          </button>
          <button
            type="button"
            onClick={cycle}
            aria-label={t('header.theme', { name: t(THEME_KEY[theme]) })}
            title={t(THEME_KEY[theme])}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg transition-colors duration-100 hover:bg-surface-2"
          >
            <ThemeIcon />
          </button>
          <button
            type="button"
            onClick={onSettingsClick}
            aria-label={t('header.openSettings')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg transition-colors duration-100 hover:bg-surface-2"
          >
            <Settings />
          </button>
        </div>
      </div>
    </header>
  );
}
