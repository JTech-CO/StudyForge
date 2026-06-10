/** 바이트 → 사람이 읽는 크기 문자열 (예: 3.4 MB). */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** 텍스트에서 제목 후보 생성 (첫 줄 또는 앞부분). */
export function makeTitle(text: string, max = 48): string {
  const firstLine = text.trim().split('\n').find((l) => l.trim().length > 0) ?? '';
  const t = firstLine.replace(/^#+\s*/, '').trim();
  if (!t) return '제목 없는 텍스트';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}
