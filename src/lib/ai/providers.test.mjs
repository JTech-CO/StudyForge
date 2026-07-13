import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { apiUrl } from './http.ts';
import { parseNotes, parseQuiz } from './parsing.ts';
import { OpenAICompatibleProvider } from './openai-compatible.ts';
import { AnthropicProvider } from './anthropic.ts';
import { testProviderConnection } from './factory.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const source = [{ id: 'source-1', kind: 'text', title: 'Test', text: 'Study material' }];
const options = { depth: 'intermediate', locale: 'en' };

test('parsers isolate fences and reject malformed quiz entries', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const notes = parseNotes(
    fence + 'json\n{"summaryMd":"Summary","detailedMd":"Details"}\n' + fence,
  );
  assert.deepEqual(notes, { summaryMd: 'Summary', detailedMd: 'Details' });

  const quiz = parseQuiz(
    JSON.stringify([
      {
        type: 'mcq',
        question: 'Q',
        options: ['A', 'B'],
        answer: 'A',
        explanation: 'Because',
      },
      { type: 'short', question: '', answer: 'ignored', explanation: 'invalid' },
    ]),
  );
  assert.equal(quiz.length, 1);
  assert.equal(quiz[0].answer, 'A');
});

test('apiUrl normalizes OpenAI-compatible roots and rejects URL credentials', () => {
  assert.equal(
    apiUrl('http://127.0.0.1:11434', 'models'),
    'http://127.0.0.1:11434/v1/models',
  );
  assert.equal(
    apiUrl('https://example.test/api/v1/', '/chat/completions'),
    'https://example.test/api/v1/chat/completions',
  );
  assert.throws(() => apiUrl('https://user:pass@example.test/v1', 'models'));
});

test('model discovery works before a model ID is selected', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: [{ id: 'local-a' }, { id: 'local-b' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  const models = await testProviderConnection('local', {
    apiKey: '',
    model: '',
    baseUrl: 'http://127.0.0.1:11434/v1',
  });
  assert.deepEqual(models, ['local-a', 'local-b']);
});
test('OpenAI adapter sends structured chat completion requests', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"summaryMd":"S","detailedMd":"D"}' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const provider = new OpenAICompatibleProvider({
    id: 'openai',
    label: 'OpenAI',
    config: {
      apiKey: 'test-key',
      model: 'gpt-test',
      baseUrl: 'https://api.openai.com/v1',
    },
  });
  const notes = await provider.generateNotes(source, options);
  assert.equal(notes.summaryMd, 'S');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/chat/completions');
  const headers = calls[0].init.headers;
  assert.equal(headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.model, 'gpt-test');
  assert.equal(body.response_format.type, 'json_schema');
  assert.equal(body.max_completion_tokens, 16384);
});

test('Anthropic adapter sends direct-browser Messages API headers', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify({
        content: [{ type: 'text', text: '[{"front":"F","back":"B"}]' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const provider = new AnthropicProvider({
    apiKey: 'anthropic-key',
    model: 'claude-test',
    baseUrl: 'https://api.anthropic.com/v1',
  });
  const cards = await provider.generateFlashcards(source, options);
  assert.deepEqual(cards, [{ front: 'F', back: 'B' }]);
  assert.equal(calls[0].init.headers['x-api-key'], 'anthropic-key');
  assert.equal(calls[0].init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.output_config.format.type, 'json_schema');
});

test('local adapter falls back when JSON schema response format is unsupported', async () => {
  const bodies = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    bodies.push(body);
    if (bodies.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'response_format unsupported' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '[{"front":"F","back":"B"}]' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const provider = new OpenAICompatibleProvider({
    id: 'local',
    label: 'Local AI',
    config: {
      apiKey: '',
      model: 'local-model',
      baseUrl: 'http://127.0.0.1:11434/v1',
    },
  });
  const cards = await provider.generateFlashcards(source, options);
  assert.equal(provider.maxConcurrency, 1);
  assert.deepEqual(cards, [{ front: 'F', back: 'B' }]);
  assert.equal(bodies.length, 2);
  assert.ok(bodies[0].response_format);
  assert.equal(bodies[1].response_format, undefined);
});
