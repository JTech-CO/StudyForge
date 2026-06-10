import { useRef, type KeyboardEvent } from 'react';
import { cx } from '../../utils/cx';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  /** tab/panel id 접두사 (panel 은 `${idPrefix}panel-${id}` 로 연결) */
  idPrefix?: string;
  className?: string;
}

/**
 * 접근성 탭 스트립 (WAI-ARIA tablist). 좌/우·Home/End 키보드 내비.
 * 패널 렌더는 호출 측에서 `role="tabpanel"` 로 처리.
 */
export function Tabs({ tabs, active, onChange, idPrefix = 'tab', className }: TabsProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = tabs.findIndex((t) => t.id === active);
    if (idx < 0) return;
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    const id = tabs[next].id;
    onChange(id);
    ref.current?.querySelector<HTMLButtonElement>(`#${idPrefix}-${id}`)?.focus();
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cx('flex gap-1 overflow-x-auto border-b border-border', className)}
    >
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idPrefix}panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cx(
              'relative -mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium',
              'transition-colors duration-100',
              selected ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
