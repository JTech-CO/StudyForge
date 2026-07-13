import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SidebarNav } from './Sidebar';
import { X } from '../ui/icons';
import { useT } from '../../hooks/useT';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

/** 모바일 오프캔버스 드로어 — 사이드바 내용 재사용. ESC·스크림 클릭으로 닫힘. */
export function Drawer({ open, onClose }: DrawerProps) {
  const { t } = useT();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      prevFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-overlay" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('drawer.menu')}
        tabIndex={-1}
        className="sf-drawer-panel absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-border bg-surface outline-none"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-semibold text-fg">{t('drawer.menu')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('drawer.close')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-surface-2 hover:text-fg"
          >
            <X />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  );
}
