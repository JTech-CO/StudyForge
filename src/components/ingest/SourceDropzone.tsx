import { useRef, useState } from 'react';
import { useStore } from '../../lib/store';
import { ACCEPT_ATTR } from '../../utils/validate';
import { Upload } from '../ui/icons';
import { cx } from '../../utils/cx';
import { useT } from '../../hooks/useT';

export function SourceDropzone() {
  const { t } = useT();
  const addFiles = useStore((s) => s.addFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    void addFiles(Array.from(list));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        aria-label={t('dropzone.fileLabel')}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cx(
          'flex w-full flex-col items-start justify-center gap-3 rounded-lg border border-dashed px-5 py-7 text-left transition-colors duration-100 sm:flex-row sm:items-center',
          dragOver ? 'border-accent bg-accent/10' : 'border-border hover:bg-surface-2',
        )}
      >
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted"
          aria-hidden="true"
        >
          <Upload size={20} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-fg">{t('dropzone.text')}</span>
          <span className="text-xs text-muted">{t('dropzone.formats')}</span>
        </span>
      </button>
    </div>
  );
}
