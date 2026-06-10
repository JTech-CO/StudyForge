import type {
  Flashcard,
  GenerateOptions,
  LLMProvider,
  NotesResult,
  PodcastTurn,
  QuizItem,
  SourceContext,
} from './provider';

export interface GeneratedArtifacts {
  notes?: NotesResult;
  mindmapMd?: string;
  quiz?: QuizItem[];
  flashcards?: Flashcard[];
  podcast?: { turns: PodcastTurn[] }; // 음성은 팟캐스트 탭에서 온디맨드 합성
  errors: Record<string, string>;
}

export interface ArtifactToggles {
  notes: boolean;
  mindmap: boolean;
  quiz: boolean;
  flashcards: boolean;
  podcast: boolean;
}

type ArtifactKey = 'notes' | 'mindmapMd' | 'quiz' | 'flashcards' | 'podcast';

const LABELS: Record<ArtifactKey, string> = {
  notes: '노트',
  mindmapMd: '마인드맵',
  quiz: '퀴즈',
  flashcards: '플래시카드',
  podcast: '팟캐스트',
};

/**
 * 토글된 산출물만 병렬 생성(Promise.allSettled). 부분 실패는 격리되어
 * errors 에 모이고, 성공한 산출물은 그대로 반환된다(한 실패가 전체를 막지 않음).
 * 팟캐스트는 스크립트(turns)만 생성하며, 음성 합성은 별도(온디맨드).
 */
export async function orchestrate(
  provider: LLMProvider,
  sources: SourceContext[],
  opt: GenerateOptions,
  toggles: ArtifactToggles,
): Promise<GeneratedArtifacts> {
  const tasks: { key: ArtifactKey; run: () => Promise<unknown> }[] = [];
  if (toggles.notes) tasks.push({ key: 'notes', run: () => provider.generateNotes(sources, opt) });
  if (toggles.mindmap) tasks.push({ key: 'mindmapMd', run: () => provider.generateMindmap(sources, opt) });
  if (toggles.quiz) tasks.push({ key: 'quiz', run: () => provider.generateQuiz(sources, opt) });
  if (toggles.flashcards) {
    tasks.push({ key: 'flashcards', run: () => provider.generateFlashcards(sources, opt) });
  }
  if (toggles.podcast) {
    tasks.push({ key: 'podcast', run: () => provider.generatePodcastScript(sources, opt) });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  const out: GeneratedArtifacts = { errors: {} };

  settled.forEach((r, i) => {
    const { key } = tasks[i];
    if (r.status === 'fulfilled') {
      if (key === 'notes') out.notes = r.value as NotesResult;
      else if (key === 'mindmapMd') out.mindmapMd = r.value as string;
      else if (key === 'quiz') out.quiz = r.value as QuizItem[];
      else if (key === 'flashcards') out.flashcards = r.value as Flashcard[];
      else if (key === 'podcast') out.podcast = { turns: r.value as PodcastTurn[] };
    } else {
      out.errors[LABELS[key]] = r.reason instanceof Error ? r.reason.message : String(r.reason);
    }
  });

  return out;
}
