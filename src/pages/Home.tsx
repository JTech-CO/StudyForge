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
  const { t, locale } = useT();
  const sources = useStore((s) => s.sources);
  const notebooks = useStore((s) => s.notebooks);
  const storageError = useStore((s) => s.storageError);
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
    if (notebookId) navigate('/notebook/' + notebookId);
  }

  return (
    <Container width="wide" className="py-8 sm:py-12">
      <section className="sf-page-head mb-8 max-w-reading">
        <p className="sf-kicker">StudyForge / {t('home.workspace')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{t('home.title')}</h1>
        <p className="mt-3 max-w-reading text-base text-muted">{t('home.subtitle')}</p>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-5 py-4 sm:px-6">
            <span className="sf-step" aria-hidden="true">
              01
            </span>
            <div>
              <p className="text-xs font-medium text-muted">{t('home.newNotebook')}</p>
              <h2 className="text-lg font-semibold text-fg">{t('home.sourceStep')}</h2>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-5 sm:p-6">
            <SourceDropzone />

            <div>
              <label htmlFor="source-text" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
                <Type size={15} /> {t('home.sourceText')}
              </label>
              <textarea
                id="source-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                placeholder={t('home.textPlaceholder')}
                className="sf-field mt-2 resize-y px-3 py-2 text-sm placeholder:text-muted focus-visible:border-accent"
              />
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" size="sm" type="button" onClick={submitText} disabled={!text.trim()}>
                  {t('home.addText')}
                </Button>
              </div>
            </div>

            <YoutubeInput />

            {sources.length > 0 && (
              <div className="border-t border-border pt-5">
                <SourceList />
              </div>
            )}
          </div>
        </Card>

        <aside className="lg:sticky lg:top-20">
          <Card>
            <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-5 py-4">
              <span className="sf-step" aria-hidden="true">
                02
              </span>
              <div>
                <p className="text-xs font-medium text-muted">{t('home.newNotebook')}</p>
                <h2 className="text-lg font-semibold text-fg">{t('home.setupStep')}</h2>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-5">
              <DepthSelector />
              <ArtifactToggles />
            </div>

            <div className="border-t border-border bg-surface-2 p-4">
              {genError && (
                <p className="mb-3 border-l-2 border-error pl-3 text-sm text-error" role="alert">
                  {genError}
                </p>
              )}
              <p className="mb-3 text-sm text-muted">
                {readyCount > 0 ? t('home.genReady', { n: readyCount }) : t('home.genEmpty')}
              </p>
              <Button
                className="w-full"
                type="button"
                onClick={onGenerate}
                loading={isGenerating}
                disabled={readyCount === 0 || isGenerating}
              >
                {isGenerating ? t('home.generating') : t('home.generate')}
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <section className="mt-12" aria-labelledby="library-title">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
          <div>
            <p className="sf-kicker">{t('home.workspace')}</p>
            <h2 id="library-title" className="text-xl font-semibold text-fg">
              {t('home.myNotebooks')}
            </h2>
          </div>
          <span className="font-mono text-sm text-muted">{String(notebooks.length).padStart(2, '0')}</span>
        </div>

        {storageError && (
          <p className="mt-4 border-l-2 border-error pl-3 text-sm text-error" role="alert">
            {storageError}
          </p>
        )}

        {storageError ? null : notebooks.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-surface px-4 py-12 text-center">
            <p className="text-sm text-muted">{t('home.notebooksEmpty')}</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {notebooks.map((notebook, index) => (
              <li key={notebook.id}>
                <Link
                  to={'/notebook/' + notebook.id}
                  className="block rounded-lg border border-border border-l-2 border-l-transparent bg-surface px-4 py-3 transition-colors duration-100 hover:border-l-accent hover:bg-surface-2"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">{notebook.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {new Date(notebook.createdAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
