import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Plus } from '../ui/icons';
import { useStore } from '../../lib/store';
import { cx } from '../../utils/cx';
import { useT } from '../../hooks/useT';

/** 사이드바·드로어 공용 내용. onNavigate 는 드로어에서 항목 클릭 시 닫기에 사용. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const navigate = useNavigate();
  const notebooks = useStore((s) => s.notebooks);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Button
        className="w-full"
        onClick={() => {
          navigate('/');
          onNavigate?.();
        }}
      >
        <Plus size={16} /> {t('sidebar.newNotebook')}
      </Button>

      <nav aria-label={t('sidebar.mainMenu')} className="flex flex-col gap-1">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'rounded-lg border-l-2 px-3 py-2 text-sm transition-colors duration-100',
              isActive
                ? 'border-accent bg-surface-2 font-medium text-fg'
                : 'border-transparent text-muted hover:bg-surface-2 hover:text-fg',
            )
          }
        >
          {t('common.home')}
        </NavLink>
      </nav>

      <section className="flex min-h-0 flex-1 flex-col gap-2" aria-label={t('sidebar.notebooks')}>
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{t('sidebar.notebooks')}</h2>
        {notebooks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-sm text-muted">
            {t('sidebar.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 overflow-y-auto">
            {notebooks.map((n) => (
              <li key={n.id}>
                <NavLink
                  to={`/notebook/${n.id}`}
                  onClick={onNavigate}
                  title={n.title}
                  className={({ isActive }) =>
                    cx(
                      'block truncate rounded-lg border-l-2 px-3 py-1.5 text-sm transition-colors duration-100',
                      isActive
                        ? 'border-accent bg-surface-2 font-medium text-fg'
                        : 'border-transparent text-muted hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  {n.title}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** 데스크톱 고정 사이드바 (모바일에서는 숨김 → Drawer 사용) */
export function Sidebar() {
  return (
    <aside
      className="sticky top-14 hidden w-64 shrink-0 self-start overflow-y-auto border-r border-border bg-bg md:block"
      style={{ maxHeight: 'calc(100dvh - 3.5rem)' }}
    >
      <SidebarNav />
    </aside>
  );
}
