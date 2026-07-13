const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export class ProviderHttpError extends Error {
  readonly status: number;

  constructor(provider: string, status: number, detail: string) {
    let message = provider + ' 요청에 실패했습니다.';
    if (status === 401 || status === 403) {
      message = provider + ' API 키가 유효하지 않거나 권한이 없습니다.';
    } else if (status === 429) {
      message = provider + ' 사용량 또는 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.';
    } else if (status >= 500) {
      message = provider + ' 서비스가 일시적으로 응답하지 않습니다.';
    } else if (detail) {
      message = provider + ' 요청 오류 (' + status + '): ' + detail;
    }
    super(message);
    this.name = 'ProviderHttpError';
    this.status = status;
  }
}

function detailFromBody(body: unknown): string {
  if (typeof body === 'string') return body.slice(0, 500);
  if (!body || typeof body !== 'object') return '';
  const value = body as Record<string, unknown>;
  const error = value.error;
  if (typeof error === 'string') return error.slice(0, 500);
  if (error && typeof error === 'object') {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string') return message.slice(0, 500);
  }
  const message = value.message ?? value.detail;
  return typeof message === 'string' ? message.slice(0, 500) : '';
}

async function responseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function networkError(provider: string, error: unknown): Error {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return new Error(provider + ' 요청 시간이 초과됐습니다.');
  }
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(
    provider +
      ' 서버에 연결하지 못했습니다. 네트워크, 엔드포인트와 브라우저 CORS 설정을 확인하세요. ' +
      detail,
  );
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function requestJson(
  provider: string,
  url: string,
  init: RequestInit,
  timeoutMs = 120_000,
  maxAttempts = 3,
): Promise<unknown> {
  const attempts = Math.max(1, Math.floor(maxAttempts));
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      const body = await responseBody(response);
      if (response.ok) return body;
      const error = new ProviderHttpError(provider, response.status, detailFromBody(body));
      if (TRANSIENT_STATUS.has(response.status) && attempt < attempts - 1) {
        lastError = error;
        await sleep(600 * 2 ** attempt);
        continue;
      }
      throw error;
    } catch (error) {
      if (error instanceof ProviderHttpError) throw error;
      lastError = networkError(provider, error);
      if (attempt < attempts - 1) {
        await sleep(600 * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : networkError(provider, lastError);
}

export function apiUrl(baseUrl: string, endpoint: string): string {
  const raw = baseUrl.trim();
  if (!raw) throw new Error('API 엔드포인트가 비어 있습니다.');
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('API 엔드포인트는 http 또는 https URL이어야 합니다.');
  }
  if (url.username || url.password) throw new Error('API 엔드포인트 URL에 인증 정보를 넣지 마세요.');
  url.search = '';
  url.hash = '';
  let path = url.pathname.replace(/\/+$/, '');
  if (!path) path = '/v1';
  url.pathname = path + '/';
  return new URL(endpoint.replace(/^\/+/, ''), url).toString();
}
