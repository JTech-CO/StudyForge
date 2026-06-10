import type { Flashcard, PodcastTurn, QuizItem } from '../ai/provider';
import type { GeneratedArtifacts } from '../ai/orchestrator';

function escapeCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

export function quizToMd(items: QuizItem[]): string {
  const lines: string[] = ['## 퀴즈', ''];
  items.forEach((q, i) => {
    lines.push(`### ${i + 1}. ${q.question}`);
    if (q.type === 'mcq' && q.options?.length) {
      q.options.forEach((o) => lines.push(`- ${o}`));
    } else if (q.type === 'truefalse') {
      lines.push('- 참', '- 거짓');
    }
    lines.push('', `**정답**: ${q.answer}`, '', `**해설**: ${q.explanation}`, '');
  });
  return lines.join('\n').trim();
}

export function flashcardsToMd(cards: Flashcard[]): string {
  const lines: string[] = ['## 플래시카드', '', '| 앞 | 뒤 |', '| --- | --- |'];
  cards.forEach((c) => lines.push(`| ${escapeCell(c.front)} | ${escapeCell(c.back)} |`));
  return lines.join('\n');
}

export function podcastToMd(turns: PodcastTurn[]): string {
  const lines: string[] = ['## 팟캐스트 대담 스크립트', ''];
  turns.forEach((t) => lines.push(`**${t.speaker}**: ${t.text}`, ''));
  return lines.join('\n').trim();
}

/** 노트북 전체를 하나의 Markdown 문서로(내보내기/공유용). */
export function notebookToMd(artifacts: GeneratedArtifacts, title: string): string {
  const parts: string[] = [`# ${title}`, ''];
  if (artifacts.notes) {
    parts.push('## 요약', '', artifacts.notes.summaryMd, '', '## 상세 노트', '', artifacts.notes.detailedMd, '');
  }
  if (artifacts.mindmapMd) parts.push('## 마인드맵', '', artifacts.mindmapMd, '');
  if (artifacts.quiz?.length) parts.push(quizToMd(artifacts.quiz), '');
  if (artifacts.flashcards?.length) parts.push(flashcardsToMd(artifacts.flashcards), '');
  if (artifacts.podcast?.turns.length) parts.push(podcastToMd(artifacts.podcast.turns), '');
  return parts.join('\n').trim();
}
