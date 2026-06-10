/**
 * 조건부 className 조합 헬퍼 (의존성 없는 미니 clsx).
 * falsy 값은 걸러내고 공백으로 합친다.
 */
export type ClassValue = string | number | false | null | undefined;

export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
