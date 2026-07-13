import type { Notebook } from '../store';
import type { GeneratedArtifacts } from '../ai/orchestrator';
import type { Flashcard, NotesResult, PodcastTurn, QuizItem, SourceKind } from '../ai/provider';
import { notebookToMd } from './md';
import { isShareCode } from '../../utils/id';

const WORKER_URL = import.meta.env.VITE_SHARE_WORKER_URL;
const REQUEST_TIMEOUT_MS = 15_000;

/** 공유 모드 — 'editable' 은 받는 사람이 자기 보관함에 사본을 저장해 편집(원본 불변).
 * 주의: 접근제어가 아닌 클라이언트 표시 힌트일 뿐(KV 는 누구나 GET 가능). */
export type ShareMode = 'readonly' | 'editable';

/** 공유 Worker 가 설정됐는지(미설정 시 공유 버튼 숨김 → MD/PNG 로 강등). */
export function shareEnabled(): boolean {
  return typeof WORKER_URL === 'string' && WORKER_URL.trim().length > 0;
}

export interface SharedNotebook {
  version?: 2;
  title: string;
  createdAt: string;
  md?: string; // Legacy v1 Markdown; v2 rebuilds it from artifacts.
  artifacts: GeneratedArtifacts;
  mode: ShareMode;
  // 소스는 파일명(PII) 을 제거하고 {id, kind} 만 — 사본의 소스 개수/종류 표시용.
  sources?: { id: string; kind: SourceKind }[];
}

function base(): string {
  return (WORKER_URL ?? '').replace(/\/+$/, '');
}

const SOURCE_KINDS = new Set<string>([
  'text', 'pdf', 'docx', 'hwp', 'hwpx', 'txt', 'md', 'youtube', 'audio', 'video',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseErrors(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function parseNotes(value: unknown): NotesResult | undefined {
  if (!isRecord(value) || typeof value.summaryMd !== 'string' || typeof value.detailedMd !== 'string') {
    return undefined;
  }
  return { summaryMd: value.summaryMd, detailedMd: value.detailedMd };
}

function parseQuizItem(value: unknown): QuizItem | null {
  if (!isRecord(value)) return null;
  const { type, question, answer, explanation } = value;
  if (
    (type !== 'mcq' && type !== 'short' && type !== 'truefalse') ||
    typeof question !== 'string' ||
    typeof answer !== 'string' ||
    typeof explanation !== 'string'
  ) return null;
  const options = Array.isArray(value.options) && value.options.every((item) => typeof item === 'string')
    ? value.options as string[]
    : undefined;
  if (type === 'mcq' && (!options || options.length < 2)) return null;
  return { type, question, answer, explanation, ...(options ? { options } : {}) };
}

function parseFlashcard(value: unknown): Flashcard | null {
  if (!isRecord(value) || typeof value.front !== 'string' || typeof value.back !== 'string') return null;
  return { front: value.front, back: value.back };
}

function parsePodcastTurn(value: unknown): PodcastTurn | null {
  if (!isRecord(value) || (value.speaker !== 'A' && value.speaker !== 'B') || typeof value.text !== 'string') {
    return null;
  }
  return { speaker: value.speaker, text: value.text };
}

function parseArtifacts(value: unknown): GeneratedArtifacts {
  if (!isRecord(value)) throw new Error('Invalid shared notebook artifacts.');
  const artifacts: GeneratedArtifacts = { errors: parseErrors(value.errors) };
  if (value.notes !== undefined) {
    const notes = parseNotes(value.notes);
    if (!notes) throw new Error('Invalid shared notes.');
    artifacts.notes = notes;
  }
  if (value.mindmapMd !== undefined) {
    if (typeof value.mindmapMd !== 'string') throw new Error('Invalid shared mindmap.');
    artifacts.mindmapMd = value.mindmapMd;
  }
  if (value.quiz !== undefined) {
    if (!Array.isArray(value.quiz)) throw new Error('Invalid shared quiz.');
    artifacts.quiz = value.quiz.map(parseQuizItem).filter((item): item is QuizItem => item !== null);
  }
  if (value.flashcards !== undefined) {
    if (!Array.isArray(value.flashcards)) throw new Error('Invalid shared flashcards.');
    artifacts.flashcards = value.flashcards
      .map(parseFlashcard)
      .filter((item): item is Flashcard => item !== null);
  }
  if (value.podcast !== undefined) {
    if (!isRecord(value.podcast) || !Array.isArray(value.podcast.turns)) {
      throw new Error('Invalid shared podcast.');
    }
    artifacts.podcast = {
      turns: value.podcast.turns
        .map(parsePodcastTurn)
        .filter((item): item is PodcastTurn => item !== null),
    };
  }
  return artifacts;
}

export function parseSharedNotebook(value: unknown): SharedNotebook {
  if (!isRecord(value) || typeof value.title !== 'string' || !value.title.trim()) {
    throw new Error('Invalid shared notebook.');
  }
  if (value.version !== undefined && value.version !== 2) {
    throw new Error('Unsupported shared notebook version.');
  }
  const artifacts = parseArtifacts(value.artifacts);
  const sources = Array.isArray(value.sources)
    ? value.sources.flatMap((source) => {
        if (
          !isRecord(source) ||
          typeof source.id !== 'string' ||
          typeof source.kind !== 'string' ||
          !SOURCE_KINDS.has(source.kind)
        ) return [];
        return [{ id: source.id, kind: source.kind as SourceKind }];
      })
    : undefined;
  return {
    title: value.title.trim(),
    ...(value.version === 2 ? { version: 2 as const } : {}),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
    md: typeof value.md === 'string' ? value.md : notebookToMd(artifacts, value.title),
    artifacts,
    mode: value.mode === 'editable' ? 'editable' : 'readonly',

    ...(sources ? { sources } : {}),
  };
}
/** 노트북을 Worker KV 에 저장하고 공유 URL(`…/notebook/<code>`) 반환. */
export async function createShareLink(nb: Notebook, mode: ShareMode = 'readonly'): Promise<string> {
  if (!shareEnabled()) throw new Error('공유 서버(Worker)가 설정되지 않았습니다.');
  const payload: SharedNotebook = {
    version: 2,
    title: nb.title,
    createdAt: nb.createdAt,
    artifacts: nb.artifacts,
    mode,
    sources: nb.sources.map((s) => ({ id: s.id, kind: s.kind })), // 파일명 제외
  };
  const res = await fetch(`${base()}/create`, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`공유 링크 생성에 실패했습니다 (${res.status}).`);
  const result: unknown = await res.json();
  if (!isRecord(result) || typeof result.id !== 'string' || result.id.length !== 8 || !isShareCode(result.id)) {
    throw new Error('Share server returned an invalid code.');
  }
  const id = result.id;
  return new URL(`${import.meta.env.BASE_URL}notebook/${id}`, location.origin).href;
}

/** 공유 ID 로 노트북 불러오기 (읽기 전용 뷰). */
export async function fetchShared(id: string, signal?: AbortSignal): Promise<SharedNotebook> {
  if (!shareEnabled()) throw new Error('공유 서버가 설정되지 않았습니다.');
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
    : AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const res = await fetch(`${base()}/${encodeURIComponent(id)}`, { signal: requestSignal });
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? '공유 노트를 찾을 수 없습니다(만료되었거나 삭제됨).'
        : `불러오기에 실패했습니다 (${res.status}).`,
    );
  }
  return parseSharedNotebook(await res.json());
}
