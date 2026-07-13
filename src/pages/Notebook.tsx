import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowRight, Pencil } from '../components/ui/icons';
import { ArtifactTabs } from '../components/render/ArtifactTabs';
import { useStore, type Notebook as NotebookType } from '../lib/store';
import { notebookToMd } from '../lib/export/md';
import {
  createShareLink,
  fetchShared,
  shareEnabled,
  type ShareMode,
  type SharedNotebook,
} from '../lib/export/share';
import { isShareCode } from '../utils/id';
import { useT } from '../hooks/useT';

// 설정 다이얼로그(App.tsx)와 동일한 라디오 패턴의 세로 변형(라벨 + 설명).
const RADIO_SPAN_COL =
  'flex flex-col items-start rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors duration-100 hover:bg-surface-2 peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent';

/** 공유 다이얼로그 — 읽기 전용/편집 가능 선택 후 링크 생성·복사. */
function ShareDialog({
  open,
  onClose,
  notebook,
}: {
  open: boolean;
  onClose: () => void;
  notebook: NotebookType;
}) {
  const { t } = useT();
  const [mode, setMode] = useState<ShareMode>('readonly');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode('readonly');
    setBusy(false);
    setUrl(null);
    setLinkCopied(false);
    setErr(null);
  }, [open, notebook.id]);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const u = await createShareLink(notebook, mode);
      try {
        await navigator.clipboard.writeText(u);
        setLinkCopied(true);
      } catch {
        setLinkCopied(false);
      }
      setUrl(u);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('notebook.shareFailed'));
    } finally {
      setBusy(false);
    }
  }

  const MODES: [ShareMode, string, string][] = [
    ['readonly', 'share.modeReadonly', 'share.modeReadonlyDesc'],
    ['editable', 'share.modeEditable', 'share.modeEditableDesc'],
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('share.title')}>
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">{t('share.mode')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map(([m, lk, dk]) => (
              <label key={m} className="cursor-pointer">
                <input
                  type="radio"
                  name="share-mode"
                  checked={mode === m}
                  onChange={() => {
                    setMode(m);
                    setUrl(null);
                    setErr(null);
                  }}
                  className="peer sr-only"
                />
                <span className={RADIO_SPAN_COL}>
                  <span className="font-medium">{t(lk)}</span>
                  <span className="mt-0.5 text-xs text-muted">{t(dk)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button variant="primary" type="button" onClick={create} loading={busy}>
            {busy ? t('share.creating') : t('share.create')}
          </Button>
        </div>

        {url && (
          <p className="text-sm text-success">
            {linkCopied ? t('notebook.shareCopied') : t('share.linkCreated')}{' '}
            <a href={url} className="break-all underline underline-offset-2">
              {url}
            </a>
          </p>
        )}
        {err && (
          <p className="text-sm text-error" role="alert">
            {err}
          </p>
        )}
      </div>
    </Modal>
  );
}

/** 소유 노트북 헤더 — 제목 인라인 편집 + 전체 MD 복사 + 공유 + 삭제. */
function NotebookHeader({ notebook }: { notebook: NotebookType }) {
  const { t } = useT();
  const navigate = useNavigate();
  const removeNotebook = useStore((s) => s.removeNotebook);
  const renameNotebook = useStore((s) => s.renameNotebook);
  const [copiedAll, setCopiedAll] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(notebook.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  async function copyAll() {
    setMutationError(null);
    try {
      await navigator.clipboard.writeText(notebookToMd(notebook.artifacts, notebook.title));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      setMutationError(t('common.copyFailed'));
    }
  }

  function startEdit() {
    setDraftTitle(notebook.title);
    setMutationError(null);
    setEditingTitle(true);
  }
  function cancelEdit() {
    setDraftTitle(notebook.title);
    setMutationError(null);
    setEditingTitle(false);
  }
  async function commitEdit() {
    const v = draftTitle.trim();
    if (!v || v === notebook.title) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    setMutationError(null);
    try {
      await renameNotebook(notebook.id, v);
      setEditingTitle(false);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t('notebook.renameFailed'));
    } finally {
      setSavingTitle(false);
    }
  }

  async function deleteCurrent() {
    if (!window.confirm(t('notebook.deleteConfirm'))) return;
    setDeleting(true);
    setMutationError(null);
    try {
      await removeNotebook(notebook.id);
      navigate('/');
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t('notebook.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mb-6">
      <p className="text-sm text-muted">{t('notebook.label')}</p>

      {editingTitle ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            disabled={savingTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void commitEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              }
            }}
            aria-label={t('notebook.renamePlaceholder')}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-2xl font-bold tracking-tight text-fg focus-visible:border-accent"
          />
          <Button size="sm" variant="primary" type="button" onClick={() => void commitEdit()} loading={savingTitle}>
            {t('common.save')}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={cancelEdit} disabled={savingTitle}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <div className="mt-1 flex items-start gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-fg">{notebook.title}</h1>
          <button
            type="button"
            onClick={startEdit}
            aria-label={t('notebook.rename')}
            title={t('notebook.rename')}
            className="mt-1.5 rounded-md p-1.5 text-muted transition-colors duration-100 hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Pencil size={18} />
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{t('notebook.sourceCount', { n: notebook.sources.length })}</span>
        <Button size="sm" variant="ghost" type="button" onClick={copyAll}>
          {copiedAll ? t('common.copied') : t('common.copyAllMd')}
        </Button>
        {shareEnabled() && (
          <Button size="sm" variant="ghost" type="button" onClick={() => setShareOpen(true)}>
            {t('notebook.shareLink')}
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          type="button"
          onClick={() => void deleteCurrent()}
          loading={deleting}
        >
          {t('common.delete')}
        </Button>
      </div>

      {mutationError && (
        <p className="mt-3 text-sm text-error" role="alert">
          {mutationError}
        </p>
      )}
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} notebook={notebook} />
    </div>
  );
}

/** 소유(로컬) 노트북 — 편집 가능(노트·마인드맵·제목). */
function OwnerNotebook({ id }: { id: string }) {
  const { t } = useT();
  const notebook = useStore((s) => s.notebook);
  const openNotebook = useStore((s) => s.openNotebook);
  const updateNotebookArtifacts = useStore((s) => s.updateNotebookArtifacts);
  const isMatch = !!notebook && notebook.id === id;
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // 로딩을 스토어 파생(isMatch)으로 판단 → StrictMode 이중호출에 강건(별도 불리언 X).
  useEffect(() => {
    if (isMatch) return;
    setNotFound(false);
    setLoadFailed(false);
    let alive = true;
    void openNotebook(id)
      .then((nb) => {
        if (alive && !nb) setNotFound(true);
      })
      .catch(() => {
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [id, isMatch, openNotebook]);

  if (!notebook || notebook.id !== id) {
    if (loadFailed) {
      return (
        <Container width="wide" className="py-8">
          <h1 className="text-2xl font-bold text-fg">{t('notebook.loadFailed')}</h1>
          <p className="mt-2 text-sm text-muted">{t('notebook.loadFailedDesc')}</p>
          <p className="mt-4">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2">
              {t('common.home')} <ArrowRight size={14} />
            </Link>
          </p>
        </Container>
      );
    }

    if (!notFound) {
      return (
        <Container width="wide" className="py-8">
          <p className="text-sm text-muted">{t('common.loading')}</p>
        </Container>
      );
    }
    return (
      <Container width="wide" className="py-8">
        <h1 className="text-2xl font-bold text-fg">{t('notebook.notFound')}</h1>
        <p className="mt-2 text-sm text-muted">{t('notebook.notFoundDesc')}</p>
        <p className="mt-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2">
            {t('common.home')} <ArrowRight size={14} />
          </Link>
        </p>
      </Container>
    );
  }

  const artifacts = notebook.artifacts;
  return (
    <Container width="wide" className="py-8">
      <NotebookHeader notebook={notebook} />
      <ArtifactTabs
        artifacts={artifacts}
        editable
        onEditNotes={(notes) => updateNotebookArtifacts(id, { notes })}
        onEditMindmap={(mindmapMd) => updateNotebookArtifacts(id, { mindmapMd })}
      />
      <p className="mt-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2">
          {t('common.backHome')} <ArrowRight size={14} />
        </Link>
      </p>
    </Container>
  );
}

/** 원격 공유 노트북 — 8자리 코드로 Worker KV 에서 로드(읽기 전용). */
function RemoteNotebook({ code }: { code: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const importSharedNotebook = useStore((s) => s.importSharedNotebook);
  const [data, setData] = useState<SharedNotebook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // deps 는 code 만(t 는 매 렌더 새 함수 → 넣으면 재fetch 루프). alive 로 StrictMode 이중호출·언마운트 후 setState 방지.
  useEffect(() => {
    if (!shareEnabled()) {
      setError(t('share.notConfigured'));
      setLoading(false);
      return;
    }
    let alive = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchShared(code, controller.signal)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : t('share.loadFailed'));
        setLoading(false);
      });
    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function saveToLibrary() {
    if (!data) return;
    setImporting(true);
    setImportError(null);
    try {
      const nid = await importSharedNotebook(data);
      navigate(`/notebook/${nid}`);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : t('share.importFailed'));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Container width="wide" className="py-8">
      {loading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : error ? (
        <div>
          <h1 className="text-2xl font-bold text-fg">{t('share.cannotOpen')}</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <p className="mt-4">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2">
              {t('common.home')} <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      ) : data ? (
        <div>
          <div className="mb-6">
            <p className="text-sm text-muted">
              {data.mode === 'editable' ? t('share.modeEditable') : t('share.readonlyNote')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg">{data.title}</h1>
            {data.mode === 'editable' && (
              <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3">
                <p className="text-sm text-muted">{t('share.editableBanner')}</p>
                <div className="mt-3">
                  <Button size="sm" variant="primary" type="button" onClick={saveToLibrary} loading={importing}>
                    {importing ? t('share.saving') : t('share.saveToLibrary')}
                  </Button>
                </div>
                {importError && (
                  <p className="mt-2 text-sm text-error" role="alert">
                    {importError}
                  </p>
                )}
              </div>
            )}
          </div>
          <ArtifactTabs artifacts={data.artifacts} />
          <p className="mt-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2">
              {t('common.backHome')} <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      ) : null}
    </Container>
  );
}

/** 노트북 라우트 — id 형태로 로컬(소유) vs 원격(공유 코드) 분기(무충돌). */
export default function Notebook() {
  const { id } = useParams();
  if (!id) return null;
  return isShareCode(id) ? <RemoteNotebook key={id} code={id} /> : <OwnerNotebook key={id} id={id} />;
}
