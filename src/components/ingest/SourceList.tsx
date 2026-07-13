import { useState } from 'react';
import { useStore, type Source } from '../../lib/store';
import { formatBytes } from '../../utils/format';
import { Button } from '../ui/Button';
import { X } from '../ui/icons';
import { useT } from '../../hooks/useT';

type TFn = (key: string, vars?: Record<string, string | number>) => string;

const STATIC_KIND: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  hwpx: 'HWPX',
  hwp: 'HWP',
  txt: 'TXT',
  md: 'MD',
  youtube: 'YouTube',
};

function kindLabel(kind: string, t: TFn): string {
  if (kind === 'text') return t('kind.text');
  if (kind === 'audio') return t('kind.audio');
  if (kind === 'video') return t('kind.video');
  return STATIC_KIND[kind] ?? kind;
}

function Spinner() {
  return (
    <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function readyDetail(src: Source, t: TFn): string {
  const parts: string[] = [];
  if (typeof src.text === 'string' && src.text.length > 0) {
    parts.push(t('sourceList.chars', { n: src.text.length.toLocaleString() }));
  }
  if (src.kind === 'youtube' && src.mediaRef?.youtubeUrl) parts.push(t('sourceList.linkReady'));
  if ((src.kind === 'audio' || src.kind === 'video') && src.mediaRef?.fileUri) {
    parts.push(t('sourceList.uploaded'));
  }
  const size = typeof src.meta?.size === 'number' ? formatBytes(src.meta.size as number) : '';
  if (size) parts.push(size);
  return parts.join(' · ');
}

function SourceRow({ src }: { src: Source }) {
  const { t } = useT();
  const removeSource = useStore((s) => s.removeSource);
  const [open, setOpen] = useState(false);
  const hasText = typeof src.text === 'string' && src.text.length > 0;

  return (
    <li className="rounded-lg border border-border bg-bg px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded border border-border px-1.5 py-0.5 text-xs font-medium text-muted">
          {kindLabel(src.kind, t)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg" title={src.title}>
            {src.title}
          </p>
          <div className="mt-0.5 text-xs">
            {src.status === 'processing' && (
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Spinner /> {t('sourceList.processing')}
              </span>
            )}
            {src.status === 'error' && <span className="text-error">{src.error}</span>}
            {src.status === 'ready' && <span className="text-muted">{readyDetail(src, t)}</span>}
          </div>

          {src.status === 'ready' && src.warning && (
            <p className="mt-1 border-l-2 border-border pl-2 text-xs text-muted">{src.warning}</p>
          )}

          {hasText && (
            <>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="mt-1 text-xs text-accent underline underline-offset-2"
              >
                {open ? t('sourceList.previewClose') : t('sourceList.previewOpen')}
              </button>
              {open && (
                <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded border border-border bg-surface-2 p-2 text-xs text-fg">
                  {src.text!.slice(0, 600)}
                  {src.text!.length > 600 ? '…' : ''}
                </pre>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => removeSource(src.id)}
          aria-label={t('sourceList.remove', { title: src.title })}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-100 hover:bg-surface-2 hover:text-fg"
        >
          <X size={15} />
        </button>
      </div>
    </li>
  );
}

export function SourceList() {
  const { t } = useT();
  const sources = useStore((s) => s.sources);
  const clearSources = useStore((s) => s.clearSources);
  if (sources.length === 0) return null;
  const errorCount = sources.filter((s) => s.status === 'error').length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-fg">{t('sourceList.title', { n: sources.length })}</h3>
        <Button variant="ghost" size="sm" type="button" onClick={clearSources}>
          {t('sourceList.clear')}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {sources.map((s) => (
          <SourceRow key={s.id} src={s} />
        ))}
      </ul>
      {errorCount > 0 && (
        <p className="mt-2 text-xs text-error" role="status">
          {t('sourceList.errorCount', { n: errorCount })}
        </p>
      )}
    </div>
  );
}
