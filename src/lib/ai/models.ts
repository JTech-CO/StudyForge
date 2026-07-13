// SDK 비의존 제공자/모델 메타데이터. 사용자 지정 모델 ID도 허용한다.

export type AIProviderId = 'gemini' | 'openai' | 'anthropic' | 'xai' | 'local';

export interface ModelOption {
  id: string;
  label: string;
  free?: boolean;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export type ProviderConfigs = Record<AIProviderId, ProviderConfig>;

export interface ProviderDefinition {
  id: AIProviderId;
  label: string;
  keyUrl?: string;
  keyPlaceholder: string;
  requiresKey: boolean;
}

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyPlaceholder: 'AIza…',
    requiresKey: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-…',
    requiresKey: true,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-…',
    requiresKey: true,
  },
  {
    id: 'xai',
    label: 'xAI',
    keyUrl: 'https://console.x.ai/',
    keyPlaceholder: 'xai-…',
    requiresKey: true,
  },
  {
    id: 'local',
    label: 'Local AI',
    keyPlaceholder: 'Optional token',
    requiresKey: false,
  },
];

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-2.5-flash-lite', label: 'Flash-Lite · 가장 저렴/빠름', free: true },
  { id: 'gemini-2.5-flash', label: 'Flash 2.5 · 가성비', free: true },
  { id: 'gemini-3.5-flash', label: 'Flash 3.5 · 최신·고품질', free: true },
  { id: 'gemini-2.5-pro', label: 'Pro · 심화(무료 한도 없음)', free: false },
];

export const DEFAULT_MODEL = 'gemini-3.5-flash';

export const PROVIDER_MODEL_OPTIONS: Record<AIProviderId, ModelOption[]> = {
  gemini: GEMINI_MODEL_OPTIONS,
  openai: [
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini · 균형' },
    { id: 'gpt-5.4', label: 'GPT-5.4 · 고품질' },
    { id: 'gpt-5-mini', label: 'GPT-5 mini · 저비용' },
  ],
  anthropic: [
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 · 균형' },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 · 빠름' },
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 · 고품질' },
  ],
  xai: [
    { id: 'grok-4.3', label: 'Grok 4.3 · 균형' },
    { id: 'grok-4.5', label: 'Grok 4.5 · 고품질' },
  ],
  local: [
    { id: 'gemma3', label: 'Gemma 3 (Ollama 예시)' },
    { id: 'gpt-oss:20b', label: 'GPT-OSS 20B (Ollama 예시)' },
  ],
};

export const DEFAULT_PROVIDER: AIProviderId = 'gemini';

export const DEFAULT_PROVIDER_CONFIGS: ProviderConfigs = {
  gemini: { apiKey: '', model: DEFAULT_MODEL, baseUrl: '' },
  openai: { apiKey: '', model: 'gpt-5.4-mini', baseUrl: 'https://api.openai.com/v1' },
  anthropic: { apiKey: '', model: 'claude-sonnet-5', baseUrl: 'https://api.anthropic.com/v1' },
  xai: { apiKey: '', model: 'grok-4.3', baseUrl: 'https://api.x.ai/v1' },
  local: { apiKey: '', model: 'gemma3', baseUrl: 'http://127.0.0.1:11434/v1' },
};

export function isProviderId(value: unknown): value is AIProviderId {
  return typeof value === 'string' && PROVIDERS.some((provider) => provider.id === value);
}

export function providerDefinition(id: AIProviderId): ProviderDefinition {
  return PROVIDERS.find((provider) => provider.id === id) ?? PROVIDERS[0];
}

// 멀티스피커 TTS (PCM 24kHz/16bit/mono 반환). 모두 preview 계열.
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const DEFAULT_VOICES: { A: string; B: string } = { A: 'Kore', B: 'Puck' };