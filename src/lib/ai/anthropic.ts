import type { ProviderConfig } from './models.ts';
import type { JsonSchema } from './json-schemas.ts';
import { apiUrl, ProviderHttpError, requestJson } from './http.ts';
import { TextGenerationProvider } from './text-provider.ts';

function contentFromResponse(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const content = (value as Record<string, unknown>).content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const value = block as Record<string, unknown>;
      return value.type === 'text' && typeof value.text === 'string' ? value.text : '';
    })
    .join('');
}

export class AnthropicProvider extends TextGenerationProvider {
  readonly name = 'anthropic';
  readonly maxConcurrency = 3;
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    super();
    this.config = config;
  }

  protected async complete(
    system: string,
    user: string,
    schema?: JsonSchema,
  ): Promise<string> {
    const send = async (structured: boolean): Promise<string> => {
      const body: Record<string, unknown> = {
        model: this.config.model,
        max_tokens: 16_384,
        system,
        messages: [{ role: 'user', content: user }],
      };
      if (structured && schema) {
        body.output_config = {
          format: { type: 'json_schema', schema },
        };
      }
      const result = await requestJson(
        'Anthropic',
        apiUrl(this.config.baseUrl, 'messages'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify(body),
        },
      );
      const content = contentFromResponse(result);
      if (!content.trim()) throw new Error('Anthropic 응답에 텍스트가 없습니다.');
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
