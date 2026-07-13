import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { RenderBoundary } from './RenderBoundary';
import { useT } from '../../hooks/useT';
import { cx } from '../../utils/cx';

// 미리보기는 기존 읽기 전용 렌더러 재사용(lazy) — 메인 번들에서 분리.
const MarkdownView = lazy(() => import('./MarkdownView').then((m) => ({ default: m.MarkdownView })));

interface Props {
  value: string;
  label: string;
  onSave: (next: string) => Promise<void>;
  onCancel: () => void;
}

/** 노트·마인드맵 마크다운 인라인 편집기 — 편집/미리보기 토글, 저장/취소(Esc=취소).
 *  미리보기는 RenderBoundary 로 격리. */
export function MarkdownEditor({ value, label, onSave, onCancel }: Props) {
  const { t } = useT();
  const [draft, setDraft] = useState(value);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 대상(value)이 바뀌면 초안·모드 재시드.
  useEffect(() => {
    setDraft(value);
    setMode('edit');
    setSaving(false);
    setError(null);
  }, [value]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !saving) {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={saving}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cx(
                'rounded-md px-3 py-1 text-sm transition-colors duration-100',
                mode === m ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {m === 'edit' ? t('common.edit') : t('common.preview')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" type="button" onClick={onCancel} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" variant="primary" type="button" onClick={() => void save()} loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </div>
      {error && (
        <p className="mb-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {mode === 'edit' ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={saving}
          spellCheck={false}
          aria-label={label}
          rows={18}
          className="sf-field resize-y px-3 py-2 text-sm leading-relaxed placeholder:text-muted focus-visible:border-accent"
        />
      ) : (
        <RenderBoundary label={label}>
          <Suspense
            fallback={
              <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
                {t('common.rendering')}
              </div>
            }
          >
            <MarkdownView markdown={draft} />
          </Suspense>
        </RenderBoundary>
      )}
    </div>
  );
}
