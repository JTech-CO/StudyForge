import type { Flashcard, NotesResult, PodcastTurn, QuizItem } from './provider.ts';

export function stripFences(text: string): string {
  const value = text.trim();
  const fence = String.fromCharCode(96).repeat(3);
  if (!value.startsWith(fence)) return value;
  const firstLineEnd = value.indexOf('\n');
  const closing = value.lastIndexOf(fence);
  if (firstLineEnd < 0 || closing <= firstLineEnd) return value;
  return value.slice(firstLineEnd + 1, closing).trim();
}

function parseJson(text: string): unknown {
  const value = stripFences(text);
  try {
    return JSON.parse(value);
  } catch {
    const firstObject = value.indexOf('{');
    const firstArray = value.indexOf('[');
    const starts = [firstObject, firstArray].filter((index) => index >= 0);
    const start = starts.length ? Math.min(...starts) : -1;
    const end = Math.max(value.lastIndexOf('}'), value.lastIndexOf(']'));
    if (start >= 0 && end > start) return JSON.parse(value.slice(start, end + 1));
    throw new Error('JSON 응답을 해석하지 못했습니다.');
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmpty(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function parseNotes(text: string): NotesResult {
  const value = record(parseJson(text));
  const summary = nonEmpty(value?.summaryMd);
  const detailed = nonEmpty(value?.detailedMd);
  if (!summary && !detailed) throw new Error('노트 JSON에 유효한 Markdown이 없습니다.');
  return {
    summaryMd: summary ?? detailed ?? '',
    detailedMd: detailed ?? summary ?? '',
  };
}

export function parseQuiz(text: string): QuizItem[] {
  const value = parseJson(text);
  if (!Array.isArray(value)) throw new Error('퀴즈 응답이 JSON 배열이 아닙니다.');
  const items: QuizItem[] = [];
  for (const entry of value) {
    const item = record(entry);
    const type = item?.type;
    const question = nonEmpty(item?.question);
    const answer = nonEmpty(item?.answer);
    const explanation = nonEmpty(item?.explanation);
    if (
      (type !== 'mcq' && type !== 'short' && type !== 'truefalse') ||
      !question ||
      !answer ||
      !explanation
    ) {
      continue;
    }
    const rawOptions = item?.options;
    const options = Array.isArray(rawOptions)
      ? rawOptions.map(nonEmpty).filter((option): option is string => option !== null)
      : [];
    if (type === 'mcq' && options.length < 2) continue;
    items.push({
      type,
      question,
      answer,
      explanation,
      ...(type === 'mcq' ? { options } : {}),
    });
  }
  if (!items.length) throw new Error('유효한 퀴즈 문항을 찾지 못했습니다.');
  return items;
}

export function parseFlashcards(text: string): Flashcard[] {
  const value = parseJson(text);
  if (!Array.isArray(value)) throw new Error('플래시카드 응답이 JSON 배열이 아닙니다.');
  const items = value.flatMap((entry): Flashcard[] => {
    const item = record(entry);
    const front = nonEmpty(item?.front);
    const back = nonEmpty(item?.back);
    return front && back ? [{ front, back }] : [];
  });
  if (!items.length) throw new Error('유효한 플래시카드를 찾지 못했습니다.');
  return items;
}

export function parsePodcast(text: string): PodcastTurn[] {
  const value = parseJson(text);
  if (!Array.isArray(value)) throw new Error('팟캐스트 응답이 JSON 배열이 아닙니다.');
  const turns = value.flatMap((entry): PodcastTurn[] => {
    const item = record(entry);
    const speaker = item?.speaker;
    const content = nonEmpty(item?.text);
    return (speaker === 'A' || speaker === 'B') && content ? [{ speaker, text: content }] : [];
  });
  if (!turns.length) throw new Error('유효한 팟캐스트 대사를 찾지 못했습니다.');
  return turns;
}
