// StudyForge 공유 링크 Worker (선택적 서버리스). Cloudflare Workers + KV.
// 배포: worker/ 에서 `npm i -D wrangler && npx wrangler kv namespace create SHARE_KV`
//       → wrangler.toml 에 id 기입 후 `npx wrangler deploy`.
// 앱에는 배포된 URL 을 VITE_SHARE_WORKER_URL 로 주입.
//
// 이 파일은 앱(src/)과 분리된 Worker 런타임용이라, 앱 tsconfig 에 포함되지 않습니다.

export interface Env {
  SHARE_KV: KVNamespace;
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

// 혼동문자 제외(no i/l/o/0/1) 영숫자 32자. 256 % 32 === 0 이라 모듈로 편향 없음.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
function makeId(len = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

/** 중복 없는 공유 코드 — KV.put 은 조용히 덮어쓰므로, 저장 전 충돌 검사(읽기→재시도). */
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
      const body = await req.text();
      if (body.length > 2_000_000) return json({ error: 'payload too large' }, 413);
      let id: string;
      try {
        id = await uniqueId(env);
      } catch {
        return json({ error: 'could not allocate id' }, 500);
      }
      // 만료 옵션: 30일 TTL
      await env.SHARE_KV.put(id, body, { expirationTtl: 60 * 60 * 24 * 30 });
      return json({ id });
    }

    // 공유 조회: GET /:id → SharedNotebook JSON
    if (req.method === 'GET' && path && path !== 'create') {
      const value = await env.SHARE_KV.get(path);
      if (!value) return json({ error: 'not found' }, 404);
      return new Response(value, {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600', ...CORS },
      });
    }

    return json({ error: 'not found' }, 404);
  },
};
