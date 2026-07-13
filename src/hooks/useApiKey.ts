import { useStore } from '../lib/store';
import type { AIProviderId } from '../lib/ai/models';

/** 제공자별 BYOK 키 접근. 키는 localStorage에만 저장된다. */
export function useApiKey(providerOverride?: AIProviderId) {
  const selected = useStore((s) => s.settings.provider);
  const provider = providerOverride ?? selected;
  const apiKey = useStore((s) => s.settings.providers[provider].apiKey);
  const setProviderApiKey = useStore((s) => s.setProviderApiKey);
  return {
    apiKey,
    setApiKey: (key: string) => setProviderApiKey(provider, key),
    hasKey: apiKey.trim().length > 0,
  };
}
