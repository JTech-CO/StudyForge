import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Type } from '../components/ui/icons';
import { SourceDropzone } from '../components/ingest/SourceDropzone';
import { YoutubeInput } from '../components/ingest/YoutubeInput';
import { SourceList } from '../components/ingest/SourceList';
import { DepthSelector } from '../components/ingest/DepthSelector';
import { ArtifactToggles } from '../components/ingest/ArtifactToggles';
import { useStore } from '../lib/store';
import { useT } from '../hooks/useT';

export default function Home() {
  const { t } = useT();
  const sources = useStore((s) => s.sources);
  const notebooks = useStore((s) => s.notebooks);
  const addText = useStore((s) => s.addText);
  const generate = useStore((s) => s.generate);
  const isGenerating = useStore((s) => s.isGenerating);
  const genError = useStore((s) => s.genError);
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const readyCount = sources.filter((s) => s.status === 'ready').length;

  function submitText() {
    if (!text.trim()) return;
    addText(text);
    setText('');
  }

  async function onGenerate() {
    const notebookId = await generate();
    if (notebookId) navigate(`/notebook/${notebookId}`);
  }

  return (
    <Container width="wide" className="py-8 sm:py-12">
      <section className="mb-10 max-w-reading">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{t('home.title')}</h1>
        <p className="mt-3 text-base text-muted">{t('home.subtitle')}</p>
      </section>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">{t('home.newNotebook')}</h2>

        <div className="mt-4 flex flex-col gap-5">
          <SourceDropzone />

          <div>
            <label
              htmlFor="source-text"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-fg"
            >
              <Type size={15} /> {t('home.sourceText')}
            </label>
            <textarea
              id="source-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={t('home.textPlaceholder')}
              className="mt-2 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-accent"
            />
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" size="sm" type="button" onClick={submitText} disabled={!text.trim()}>
                {t('home.addText')}
              </Button>
            </div>
          </div>

          <YoutubeInput />
        </div>

        {sources.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <SourceList />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-5 border-t border-border pt-5">
          <DepthSelector />
          <ArtifactToggles />
        </div>

        <div className="mt-6 border-t border-border pt-5">
          {genError && (
            <p
              className="mb-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-error"
              role="alert"
            >
              {genError}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {readyCount > 0
                ? t('home.genReady', { n: readyCount })
                : t('home.genEmpty')}
            </p>
            <Button
              type="button"
              onClick={onGenerate}
              loading={isGenerating}
              disabled={readyCount === 0 || isGenerating}
            >
              {isGenerating ? t('home.generating') : t('home.generate')}
            </Button>
          </div>
        </div>
      </Card>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-fg">{t('home.myNotebooks')}</h2>
        {notebooks.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm text-muted">{t('home.notebooksEmpty')}</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {notebooks.map((n) => (
              <li key={n.id}>
                <Link
                  to={`/notebook/${n.id}`}
                  className="block rounded-lg border border-border bg-surface px-4 py-3 transition-colors duration-100 hover:bg-surface-2"
                >
                  <p className="truncate font-medium text-fg">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(n.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
