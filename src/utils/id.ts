/** 충돌 없는 짧은 ID. crypto.randomUUID 우선, 미지원 시 폴백. */
export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* 폴백으로 진행 */
  }
  return `id-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Recognizes current 8-character and legacy 10-character share codes.
 * Local notebook IDs cannot collide with this route shape. */
export function isShareCode(id: string): boolean {
  return /^(?:[a-hjkmnp-z2-9]{8}|[a-hjkmnp-z2-9]{10})$/.test(id);
}
