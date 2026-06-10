import { useStore } from '../lib/store';

/** BYOK 키 접근 훅. 키는 store(persist)→localStorage 에만 저장, 서버 전송 없음. */
export function useApiKey() {
  const apiKey = useStore((s) => s.settings.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  return { apiKey, setApiKey, hasKey: apiKey.trim().length > 0 };
}
