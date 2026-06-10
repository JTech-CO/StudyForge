import { useStore } from '../lib/store';
import { translate } from '../lib/i18n/strings';

/** UI 번역 훅. settings.locale 에 따라 ko/en 문자열 반환. t('key', { var }). */
export function useT() {
  const locale = useStore((s) => s.settings.locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  return { t, locale };
}
