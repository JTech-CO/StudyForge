import { lazy, Suspense, useRef, useState } from 'react';
import type { GeneratedArtifacts } from '../../lib/ai/orchestrator';
import type { NotesResult } from '../../lib/ai/provider';
import { Tabs, type TabItem } from '../ui';
import { Button } from '../ui/Button';
import { RenderBoundary } from './RenderBoundary';
import { MarkdownEditor } from './MarkdownEditor';
import { Quiz } from './Quiz';
import { Flashcards } from './Flashcards';
import { PodcastPlayer } from './PodcastPlayer';
import { flashcardsToMd, podcastToMd, quizToMd } from '../../lib/export/md';
import { useT } from '../../hooks/useT';
import { cx } from '../../utils/cx';

const MarkdownView = lazy(() =>
  import('./MarkdownView').then((m) => ({ default: m.MarkdownView })),
);
const MindMap = lazy(() => import('./MindMap').then((m) => ({ default: m.MindMap })));

function RenderFallback() {
  const { t } = useT();
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
      {t('common.rendering')}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* 무시 */
        }
      }}
    >
      {copied ? t('common.copied') : t('common.copyMd')}
    </Button>
  );
}

type TabId = 'notes' | 'mindmap' | 'quiz' | 'flashcards' | 'podcast';

// errorKey 는 orchestrator 가 errors 에 넣는 한국어 라벨(고정 키), labelKey 는 표시용 i18n 키.
const TAB_DEFS: {
  id: TabId;
  labelKey: string;
  errorKey: string;
  present: (a: GeneratedArtifacts) => boolean;
}[] = [
  { id: 'notes', labelKey: 'artifact.notes', errorKey: '노트', present: (a) => !!a.notes },
  { id: 'mindmap', labelKey: 'artifact.mindmap', errorKey: '마인드맵', present: (a) => !!a.mindmapMd },
  { id: 'quiz', labelKey: 'artifact.quiz', errorKey: '퀴즈', present: (a) => !!(a.quiz && a.quiz.length) },
  {
    id: 'flashcards',
    labelKey: 'artifact.flashcards',
    errorKey: '플래시카드',
    present: (a) => !!(a.flashcards && a.flashcards.length),
  },
  {
    id: 'podcast',
    labelKey: 'artifact.podcast',
    errorKey: '팟캐스트',
    present: (a) => !!(a.podcast && a.podcast.turns.length),
  },
];

/** 노트북 산출물 탭 뷰. 탭별 MD 복사 + 노트 PNG.
 *  editable + onEdit* 가 주어지면(로컬 소유) 노트·마인드맵 인라인 편집, 그 외는 읽기 전용. */
export function ArtifactTabs({
  artifacts,
  editable = false,
  onEditNotes,
  onEditMindmap,
}: {
  artifacts: GeneratedArtifacts;
  editable?: boolean;
  onEditNotes?: (next: NotesResult) => void;
  onEditMindmap?: (next: string) => void;
}) {
  const { t } = useT();
  const tabDefs = TAB_DEFS.filter((d) => d.present(artifacts) || artifacts.errors[d.errorKey]);
  const tabs: TabItem[] = tabDefs.map((d) => ({ id: d.id, label: t(d.labelKey) }));
  const [active, setActive] = useState<string>(tabDefs[0]?.id ?? 'notes');
  const [noteView, setNoteView] = useState<'summary' | 'detailed'>('detailed');
  const notesRef = useRef<HTMLDivElement>(null);
  const [pngBusy, setPngBusy] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingMindmap, setEditingMindmap] = useState(false);
  const canEditNotes = editable && !!onEditNotes;
  const canEditMindmap = editable && !!onEditMindmap;

  if (tabDefs.length === 0) return <Placeholder text={t('tabs.noArtifacts')} />;
  const activeId = (tabDefs.some((d) => d.id === active) ? active : tabDefs[0].id) as TabId;

  const notes = artifacts.notes;
  const noteMd = notes ? (noteView === 'summary' ? notes.summaryMd : notes.detailedMd) : '';

  async function savePng() {
    if (!notesRef.current) return;
    setPngBusy(true);
    try {
      // html-to-image 는 클릭 시에만 로드 (메인 번들에서 분리)
      const { exportNodeToPng } = await import('../../lib/export/image');
      await exportNodeToPng(notesRef.current, 'studyforge-note.png');
    } catch {
      /* 무시 */
    } finally {
      setPngBusy(false);
    }
  }

  const failed = (errorKey: string, nameKey: string) =>
    t('tabs.genFailed', { name: t(nameKey), msg: artifacts.errors[errorKey] });
  const notGen = (nameKey: string) => t('tabs.notGenerated', { name: t(nameKey) });

  return (
    <div>
      <Tabs tabs={tabs} active={activeId} onChange={setActive} className="mb-4" />

      {activeId === 'notes' && (
        <section role="tabpanel" aria-labelledby="tab-notes">
          {artifacts.errors['노트'] ? (
            <Placeholder text={failed('노트', 'artifact.notes')} />
          ) : notes ? (
            editingNotes ? (
              // 한 번에 한 필드(요약/상세)만 편집 → 토글 숨김으로 편집 유실 방지.
              <MarkdownEditor
                value={noteMd}
                label={t('artifact.notes')}
                onSave={(next) => {
                  onEditNotes?.(
                    noteView === 'summary'
                      ? { summaryMd: next, detailedMd: notes.detailedMd }
                      : { summaryMd: notes.summaryMd, detailedMd: next },
                  );
                  setEditingNotes(false);
                }}
                onCancel={() => setEditingNotes(false)}
              />
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-lg border border-border p-0.5">
                    {(['summary', 'detailed'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setNoteView(v)}
                        aria-pressed={noteView === v}
                        className={cx(
                          'rounded-md px-3 py-1 text-sm transition-colors duration-100',
                          noteView === v ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:text-fg',
                        )}
                      >
                        {v === 'summary' ? t('tabs.summary') : t('tabs.detailed')}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {canEditNotes && (
                      <Button size="sm" variant="ghost" type="button" onClick={() => setEditingNotes(true)}>
                        {t('common.edit')}
                      </Button>
                    )}
                    <CopyButton text={noteMd} />
                    <Button size="sm" variant="ghost" type="button" onClick={savePng} loading={pngBusy}>
                      {t('common.savePng')}
                    </Button>
                  </div>
                </div>
                <RenderBoundary label={t('artifact.notes')}>
                  <div ref={notesRef} className="bg-bg">
                    <Suspense fallback={<RenderFallback />}>
                      <MarkdownView markdown={noteMd} />
                    </Suspense>
                  </div>
                </RenderBoundary>
              </div>
            )
          ) : (
            <Placeholder text={notGen('artifact.notes')} />
          )}
        </section>
      )}

      {activeId === 'mindmap' && (
        <section role="tabpanel" aria-labelledby="tab-mindmap">
          {artifacts.errors['마인드맵'] ? (
            <Placeholder text={failed('마인드맵', 'artifact.mindmap')} />
          ) : artifacts.mindmapMd ? (
            editingMindmap ? (
              <MarkdownEditor
                value={artifacts.mindmapMd}
                label={t('artifact.mindmap')}
                onSave={(next) => {
                  onEditMindmap?.(next);
                  setEditingMindmap(false);
                }}
                onCancel={() => setEditingMindmap(false)}
              />
            ) : (
              <div>
                <div className="mb-4 flex justify-end gap-2">
                  {canEditMindmap && (
                    <Button size="sm" variant="ghost" type="button" onClick={() => setEditingMindmap(true)}>
                      {t('common.edit')}
                    </Button>
                  )}
                  <CopyButton text={artifacts.mindmapMd} />
                </div>
                <RenderBoundary label={t('artifact.mindmap')}>
                  <Suspense fallback={<RenderFallback />}>
                    <MindMap markdown={artifacts.mindmapMd} />
                  </Suspense>
                </RenderBoundary>
              </div>
            )
          ) : (
            <Placeholder text={notGen('artifact.mindmap')} />
          )}
        </section>
      )}

      {activeId === 'quiz' && (
        <section role="tabpanel" aria-labelledby="tab-quiz">
          {artifacts.errors['퀴즈'] ? (
            <Placeholder text={failed('퀴즈', 'artifact.quiz')} />
          ) : artifacts.quiz && artifacts.quiz.length > 0 ? (
            <div>
              <div className="mb-4 flex justify-end">
                <CopyButton text={quizToMd(artifacts.quiz)} />
              </div>
              <RenderBoundary label={t('artifact.quiz')}>
                <Quiz items={artifacts.quiz} />
              </RenderBoundary>
            </div>
          ) : (
            <Placeholder text={notGen('artifact.quiz')} />
          )}
        </section>
      )}

      {activeId === 'flashcards' && (
        <section role="tabpanel" aria-labelledby="tab-flashcards">
          {artifacts.errors['플래시카드'] ? (
            <Placeholder text={failed('플래시카드', 'artifact.flashcards')} />
          ) : artifacts.flashcards && artifacts.flashcards.length > 0 ? (
            <div>
              <div className="mb-4 flex justify-end">
                <CopyButton text={flashcardsToMd(artifacts.flashcards)} />
              </div>
              <RenderBoundary label={t('artifact.flashcards')}>
                <Flashcards cards={artifacts.flashcards} />
              </RenderBoundary>
            </div>
          ) : (
            <Placeholder text={notGen('artifact.flashcards')} />
          )}
        </section>
      )}

      {activeId === 'podcast' && (
        <section role="tabpanel" aria-labelledby="tab-podcast">
          {artifacts.errors['팟캐스트'] ? (
            <Placeholder text={failed('팟캐스트', 'artifact.podcast')} />
          ) : artifacts.podcast && artifacts.podcast.turns.length > 0 ? (
            <div>
              <div className="mb-4 flex justify-end">
                <CopyButton text={podcastToMd(artifacts.podcast.turns)} />
              </div>
              <RenderBoundary label={t('artifact.podcast')}>
                <PodcastPlayer turns={artifacts.podcast.turns} />
              </RenderBoundary>
            </div>
          ) : (
            <Placeholder text={notGen('artifact.podcast')} />
          )}
        </section>
      )}
    </div>
  );
}
