import type { Notebook } from '../store';
import type { GeneratedArtifacts } from '../ai/orchestrator';
import type { SourceKind } from '../ai/provider';
import { notebookToMd } from './md';

const WORKER_URL = import.meta.env.VITE_SHARE_WORKER_URL;

/** 공유 모드 — 'editable' 은 받는 사람이 자기 보관함에 사본을 저장해 편집(원본 불변).
 * 주의: 접근제어가 아닌 클라이언트 표시 힌트일 뿐(KV 는 누구나 GET 가능). */
export type ShareMode = 'readonly' | 'editable';

/** 공유 Worker 가 설정됐는지(미설정 시 공유 버튼 숨김 → MD/PNG 로 강등). */
export function shareEnabled(): boolean {
  return typeof WORKER_URL === 'string' && WORKER_URL.trim().length > 0;
}

export interface SharedNotebook {
  title: string;
  createdAt: string;
  md: string; // 전체 노트북 Markdown
  artifacts: GeneratedArtifacts;
  mode: ShareMode;
  // 소스는 파일명(PII) 을 제거하고 {id, kind} 만 — 사본의 소스 개수/종류 표시용.
  sources?: { id: string; kind: SourceKind }[];
}

function base(): string {
  return (WORKER_URL ?? '').replace(/\/+$/, '');
}

/** 노트북을 Worker KV 에 저장하고 공유 URL(`…/notebook/<code>`) 반환. */
export async function createShareLink(nb: Notebook, mode: ShareMode = 'readonly'): Promise<string> {
  if (!shareEnabled()) throw new Error('공유 서버(Worker)가 설정되지 않았습니다.');
  const payload: SharedNotebook = {
    title: nb.title,
    createdAt: nb.createdAt,
    md: notebookToMd(nb.artifacts, nb.title),
    artifacts: nb.artifacts,
    mode,
    sources: nb.sources.map((s) => ({ id: s.id, kind: s.kind })), // 파일명 제외
  };
  const res = await fetch(`${base()}/create`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`공유 링크 생성에 실패했습니다 (${res.status}).`);
  const { id } = (await res.json()) as { id: string };
  return new URL(`${import.meta.env.BASE_URL}notebook/${id}`, location.origin).href;
}

/** 공유 ID 로 노트북 불러오기 (읽기 전용 뷰). */
export async function fetchShared(id: string): Promise<SharedNotebook> {
  if (!shareEnabled()) throw new Error('공유 서버가 설정되지 않았습니다.');
  const res = await fetch(`${base()}/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? '공유 노트를 찾을 수 없습니다(만료되었거나 삭제됨).'
        : `불러오기에 실패했습니다 (${res.status}).`,
    );
  }
  return (await res.json()) as SharedNotebook;
}
