export type JsonSchema = Record<string, unknown>;

export const NOTES_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    summaryMd: { type: 'string' },
    detailedMd: { type: 'string' },
  },
  required: ['summaryMd', 'detailedMd'],
  additionalProperties: false,
};

export const QUIZ_JSON_SCHEMA: JsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['mcq', 'short', 'truefalse'] },
      question: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      answer: { type: 'string' },
      explanation: { type: 'string' },
    },
    required: ['type', 'question', 'options', 'answer', 'explanation'],
    additionalProperties: false,
  },
};

export const FLASHCARDS_JSON_SCHEMA: JsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      front: { type: 'string' },
      back: { type: 'string' },
    },
    required: ['front', 'back'],
    additionalProperties: false,
  },
};

export const PODCAST_JSON_SCHEMA: JsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      speaker: { type: 'string', enum: ['A', 'B'] },
      text: { type: 'string' },
    },
    required: ['speaker', 'text'],
    additionalProperties: false,
  },
};
