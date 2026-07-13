// StudyForge 공유 링크 Worker (선택적 서버리스). Cloudflare Workers + KV.
// 배포: worker/ 에서 `npm i -D wrangler && npx wrangler kv namespace create SHARE_KV`
//       → wrangler.toml 에 id 기입 후 `npx wrangler deploy`.
// 앱에는 배포된 URL 을 VITE_SHARE_WORKER_URL 로 주입.
//
// 이 파일은 앱(src/)과 분리된 Worker 런타임용이라, 앱 tsconfig 에 포함되지 않습니다.

interface ShareKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}

export interface Env {
  SHARE_KV: ShareKv;
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

// 혼동 문자(i/l/o/0/1)를 제외하고 rejection sampling으로 모듈로 편향을 없앤다.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const SHARE_CODE = /^(?:[a-hjkmnp-z2-9]{8}|[a-hjkmnp-z2-9]{10})$/;
const MAX_PAYLOAD_BYTES = 2_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSharedNotebook(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 200) return false;
  if (typeof value.createdAt !== 'string' || !isRecord(value.artifacts)) {
    return false;
  }
  if (value.version !== undefined && value.version !== 2) return false;
  if (value.md !== undefined && typeof value.md !== 'string') return false;
  if (value.mode !== undefined && value.mode !== 'readonly' && value.mode !== 'editable') return false;
  if (value.sources !== undefined) {
    if (!Array.isArray(value.sources) || value.sources.length > 100) return false;
    if (
      !value.sources.every(
        (source) =>
          isRecord(source) &&
          typeof source.id === 'string' &&
          source.id.length <= 100 &&
          typeof source.kind === 'string' &&
          source.kind.length <= 20,
      )
    ) return false;
  }
  return true;
}

async function readBodyLimited(req: Request): Promise<string | null> {
  const declaredBytes = Number(req.headers.get('content-length'));
  if (Number.isFinite(declaredBytes) && declaredBytes > MAX_PAYLOAD_BYTES) return null;
  if (!req.body) return '';

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function makeId(len = 8): string {
  const unbiasedLimit = 256 - (256 % ALPHABET.length);
  let id = '';
  while (id.length < len) {
    const bytes = crypto.getRandomValues(new Uint8Array(len - id.length));
    for (const byte of bytes) {
      if (byte >= unbiasedLimit) continue;
      id += ALPHABET[byte % ALPHABET.length];
      if (id.length === len) break;
    }
  }
  return id;
}

// KV read-then-write avoids observed collisions; strict atomic uniqueness requires a Durable Object.
async function uniqueId(env: Env): Promise<string> {
  for (let i = 0; i < 7; i++) {
    const id = makeId();
    if (!(await env.SHARE_KV.get(id))) return id;
  }
  throw new Error('id allocation failed');
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const path = new URL(req.url).pathname.replace(/^\/+|\/+$/g, '');

    // 공유 생성: POST /create  { ...SharedNotebook }  → { id }
    // mode 는 접근제어가 아닌 클라이언트 힌트일 뿐(KV 는 누구나 GET) — PII 는 페이로드에 담지 않는다.
    if (req.method === 'POST' && path === 'create') {
      if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
        return json({ error: 'content-type must be application/json' }, 415);
      }
      const body = await readBodyLimited(req);
      if (body === null) return json({ error: 'payload too large' }, 413);
      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        return json({ error: 'invalid json' }, 400);
      }
      if (!isSharedNotebook(payload)) return json({ error: 'invalid shared notebook' }, 400);
      let id: string;
      try {
        id = await uniqueId(env);
      } catch {
        return json({ error: 'could not allocate id' }, 500);
      }
      // 만료 옵션: 30일 TTL
      await env.SHARE_KV.put(id, body, { expirationTtl: 60 * 60 * 24 * 30 });
      return json({ id }, 201);
    }

    // 공유 조회: GET /:id → SharedNotebook JSON
    if (req.method === 'GET' && SHARE_CODE.test(path)) {
      const value = await env.SHARE_KV.get(path);
      if (!value) return json({ error: 'not found' }, 404);
      return new Response(value, {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600', ...CORS },
      });
    }

    return json({ error: 'not found' }, 404);
  },
};
