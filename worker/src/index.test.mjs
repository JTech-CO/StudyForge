import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './index.ts';

function makeEnv() {
  const values = new Map();
  const puts = [];
  return {
    values,
    puts,
    env: {
      SHARE_KV: {
        get: async (key) => values.get(key) ?? null,
        put: async (key, value, options) => {
          values.set(key, value);
          puts.push({ key, options });
        },
      },
    },
  };
}

function request(env, path, init) {
  return worker.fetch(new Request('https://worker.test/' + path, init), env);
}

const payload = {
  version: 2,
  title: 'Test notebook',
  createdAt: '2026-07-13T00:00:00.000Z',
  artifacts: { errors: {} },
  mode: 'readonly',
};

test('creates and retrieves v2 and legacy shares', async () => {
  const { env, values, puts } = makeEnv();
  const created = await request(env, 'create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(created.status, 201);
  const { id } = await created.json();
  assert.match(id, /^[a-hjkmnp-z2-9]{8}$/);
  assert.equal(puts[0].options.expirationTtl, 60 * 60 * 24 * 30);

  const loaded = await request(env, id);
  assert.equal(loaded.status, 200);
  assert.deepEqual(await loaded.json(), payload);

  const legacyId = 'abcd234567';
  values.set(legacyId, JSON.stringify({ ...payload, version: undefined, md: '# Legacy' }));
  const legacy = await request(env, legacyId);
  assert.equal(legacy.status, 200);
});

test('rejects malformed and oversized create requests', async () => {
  const { env } = makeEnv();
  const wrongType = await request(env, 'create', { method: 'POST', body: '{}' });
  assert.equal(wrongType.status, 415);

  const invalidJson = await request(env, 'create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(invalidJson.status, 400);

  const invalidVersion = await request(env, 'create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, version: 3 }),
  });
  assert.equal(invalidVersion.status, 400);

  const oversized = await request(env, 'create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'x'.repeat(2_000_001),
  });
  assert.equal(oversized.status, 413);
});

test('rejects unknown routes', async () => {
  const { env } = makeEnv();
  const response = await request(env, 'not-a-share-code');
  assert.equal(response.status, 404);
});
