/** 충돌 없는 짧은 ID. crypto.randomUUID 우선, 미지원 시 폴백. */
export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* 폴백으로 진행 */
  }
  return `id-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** 공유 코드(Worker 발급 8자 영숫자) 판별. 로컬 id(UUID·하이픈 / `id-…` 폴백)와
 *  형태가 겹치지 않아 라우트의 로컬/원격 분기를 무충돌로 결정한다. */
export function isShareCode(id: string): boolean {
  return /^[a-hjkmnp-z2-9]{8}$/.test(id);
}
