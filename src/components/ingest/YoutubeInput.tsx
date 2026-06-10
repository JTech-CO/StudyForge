import { useState } from 'react';
import { useStore } from '../../lib/store';
import { parseYoutube } from '../../utils/validate';
import { Button } from '../ui/Button';
import { Youtube } from '../ui/icons';
import { cx } from '../../utils/cx';
import { useT } from '../../hooks/useT';

export function YoutubeInput() {
  const { t } = useT();
  const addYoutube = useStore((s) => s.addYoutube);
  const [url, setUrl] = useState('');
  const trimmed = url.trim();
  const valid = trimmed.length === 0 ? null : parseYoutube(trimmed) !== null;

  function submit() {
    if (!parseYoutube(trimmed)) return;
    addYoutube(trimmed);
    setUrl('');
  }

  return (
    <div>
      <label htmlFor="yt-url" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
        <Youtube size={15} /> {t('youtube.label')}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="yt-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="https://youtu.be/..."
          aria-invalid={valid === false}
          className={cx(
            'min-w-0 flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-accent',
            valid === false ? 'border-error' : 'border-border',
          )}
        />
        <Button type="button" onClick={submit} disabled={valid !== true}>
          {t('common.add')}
        </Button>
      </div>
      {valid === false && (
        <p className="mt-1.5 text-xs text-error">{t('youtube.invalid')}</p>
      )}
    </div>
  );
}
