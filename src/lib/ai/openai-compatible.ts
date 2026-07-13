import type { AIProviderId, ProviderConfig } from './models.ts';
import type { JsonSchema } from './json-schemas.ts';
import { apiUrl, ProviderHttpError, requestJson } from './http.ts';
import { TextGenerationProvider } from './text-provider.ts';

interface OpenAICompatibleOptions {
  id: Extract<AIProviderId, 'openai' | 'xai' | 'local'>;
  label: string;
  config: ProviderConfig;
}

function contentFromResponse(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const choices = (value as Record<string, unknown>).choices;
  if (!Array.isArray(choices) || !choices.length) return '';
  const choice = choices[0];
  if (!choice || typeof choice !== 'object') return '';
  const message = (choice as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') return '';
  const content = (message as Record<string, unknown>).content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const text = (part as Record<string, unknown>).text;
      return typeof text === 'string' ? text : '';
    })
    .join('');
}

export class OpenAICompatibleProvider extends TextGenerationProvider {
  readonly name: string;
  readonly maxConcurrency: number;
  private readonly id: OpenAICompatibleOptions['id'];
  private readonly label: string;
  private readonly config: ProviderConfig;

  constructor(options: OpenAICompatibleOptions) {
    super();
    this.id = options.id;
    this.name = options.id;
    this.label = options.label;
    this.config = options.config;
    this.maxConcurrency = options.id === 'local' ? 1 : 3;
  }

  protected async complete(
    system: string,
    user: string,
    schema?: JsonSchema,
    schemaName = 'studyforge_response',
  ): Promise<string> {
    const send = async (structured: boolean): Promise<string> => {
      const body: Record<string, unknown> = {
        model: this.config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      };
      if (this.id === 'openai') body.max_completion_tokens = 16_384;
      else body.max_tokens = 16_384;
      if (structured && schema) {
        body.response_format = {
          type: 'json_schema',
          json_schema: { name: schemaName, strict: true, schema },
        };
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.config.apiKey.trim()) headers.Authorization = 'Bearer ' + this.config.apiKey.trim();
      const result = await requestJson(
        this.label,
        apiUrl(this.config.baseUrl, 'chat/completions'),
        { method: 'POST', headers, body: JSON.stringify(body) },
        this.id === 'local' ? 300_000 : 120_000,
      );
      const content = contentFromResponse(result);
      if (!content.trim()) throw new Error(this.label + ' 응답에 텍스트가 없습니다.');
      return content;
    };

    try {
      return await send(Boolean(schema));
    } catch (error) {
      if (schema && error instanceof ProviderHttpError && error.status === 400) {
        return send(false);
      }
      throw error;
    }
  }
}
