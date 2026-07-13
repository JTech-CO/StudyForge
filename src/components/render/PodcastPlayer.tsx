import { useEffect, useRef, useState } from 'react';
import type { PodcastTurn } from '../../lib/ai/provider';
import { useApiKey } from '../../hooks/useApiKey';
import { DEFAULT_VOICES } from '../../lib/ai/models';
import { Button } from '../ui/Button';
import { cx } from '../../utils/cx';
import { useT } from '../../hooks/useT';

/**
 * 2인 대담 스크립트 표시 + 온디맨드 멀티스피커 TTS 합성(비용 발생) →
 * 네이티브 오디오 플레이어(재생/일시정지/진행바) + WAV 다운로드.
 */
export function PodcastPlayer({ turns }: { turns: PodcastTurn[] }) {
  const { t } = useT();
  const { apiKey } = useApiKey('gemini');
  const [synthesizing, setSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  async function synthesize() {
    if (!apiKey.trim()) {
      setError(t('podcast.needKey'));
      return;
    }
    setSynthesizing(true);
    setError(null);
    try {
      const { GeminiProvider } = await import('../../lib/ai/gemini');
      const blob = await new GeminiProvider(apiKey).synthesizeDialogue(turns, DEFAULT_VOICES);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudioUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('podcast.failed'));
    } finally {
      setSynthesizing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{t('podcast.turns', { n: turns.length })}</p>
        {audioUrl ? (
          <a
            href={audioUrl}
            download="studyforge-podcast.wav"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-fg transition-colors duration-100 hover:bg-surface-2"
          >
            {t('podcast.download')}
          </a>
        ) : (
          <Button type="button" onClick={synthesize} loading={synthesizing} disabled={synthesizing}>
            {synthesizing ? t('podcast.synthesizing') : t('podcast.synthesize')}
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full">
          {t('podcast.audioUnsupported')}
        </audio>
      )}

      {synthesizing && (
        <p className="text-xs text-muted">
          {t('podcast.synthNote')}
        </p>
      )}

      <ol className="flex flex-col gap-3 border-t border-border pt-4">
        {turns.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span
              className={cx(
                'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold',
                t.speaker === 'A' ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-muted',
              )}
            >
              {t.speaker}
            </span>
            <p className="whitespace-pre-wrap text-sm text-fg">{t.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
