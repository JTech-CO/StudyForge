import type { LLMProvider } from './provider.ts';
import {
  type AIProviderId,
  type ProviderConfig,
  providerDefinition,
} from './models.ts';
import { apiUrl, requestJson } from './http.ts';

function requireConfig(provider: AIProviderId, config: ProviderConfig, requireModel = true): void {
  const definition = providerDefinition(provider);
  if (definition.requiresKey && !config.apiKey.trim()) {
    throw new Error(definition.label + ' API 키가 필요합니다.');
  }
  if (requireModel && !config.model.trim()) throw new Error(definition.label + ' 모델 ID가 필요합니다.');
  if (provider === 'local' && !config.baseUrl.trim()) {
    throw new Error('로컬 AI 엔드포인트가 필요합니다.');
  }
}

export async function createLlmProvider(
  provider: AIProviderId,
  config: ProviderConfig,
): Promise<LLMProvider> {
  requireConfig(provider, config);
  if (provider === 'gemini') {
    const { GeminiProvider } = await import('./gemini');
    return new GeminiProvider(config.apiKey, config.model);
  }
  if (provider === 'anthropic') {
    const { AnthropicProvider } = await import('./anthropic');
    return new AnthropicProvider(config);
  }
  const { OpenAICompatibleProvider } = await import('./openai-compatible');
  const label = provider === 'openai' ? 'OpenAI' : provider === 'xai' ? 'xAI' : 'Local AI';
  return new OpenAICompatibleProvider({ id: provider, label, config });
}

function modelIds(value: unknown, gemini = false): string[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const entries = gemini ? record.models : record.data;
  if (!Array.isArray(entries)) return [];
  return entries
    .flatMap((entry): string[] => {
      if (!entry || typeof entry !== 'object') return [];
      const item = entry as Record<string, unknown>;
      const raw = gemini ? item.name : item.id;
      if (typeof raw !== 'string') return [];
      return [gemini ? raw.replace(/^models\//, '') : raw];
    })
    .filter((id) => id.length > 0);
}

export async function testProviderConnection(
  provider: AIProviderId,
  config: ProviderConfig,
): Promise<string[]> {
  requireConfig(provider, config, false);
  if (provider === 'gemini') {
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models?key=' +
      encodeURIComponent(config.apiKey.trim());
    const result = await requestJson('Gemini', url, { method: 'GET' }, 15_000, 1);
    return modelIds(result, true);
  }

  const headers: Record<string, string> = {};
  if (provider === 'anthropic') {
    headers['x-api-key'] = config.apiKey.trim();
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (config.apiKey.trim()) {
    headers.Authorization = 'Bearer ' + config.apiKey.trim();
  }
  const result = await requestJson(
    providerDefinition(provider).label,
    apiUrl(config.baseUrl, 'models'),
    { method: 'GET', headers },
    15_000,
    1,
  );
  return modelIds(result);
}
