import { Type } from '@google/genai';

// responseSchema 로 구조화 출력(JSON) 강제. 마크다운은 문자열 필드에 담는다.
export const NOTES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summaryMd: {
      type: Type.STRING,
      description: '핵심만 간추린 요약본 (Markdown). 빠른 복습용, 5~12줄 분량.',
    },
    detailedMd: {
      type: Type.STRING,
      description:
        '깊이에 맞춘 상세 노트 (Markdown). h2/h3 위계, 표·LaTeX($...$)·언어 태그 코드블록·필요 시 mermaid 포함.',
    },
  },
  required: ['summaryMd', 'detailedMd'],
};

export const QUIZ_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ['mcq', 'short', 'truefalse'],
        description: '문항 유형: mcq(객관식)·short(단답)·truefalse(참거짓)',
      },
      question: { type: Type.STRING, description: '문제 (평문)' },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'mcq 일 때만 보기 4개. 다른 유형은 비움.',
      },
      answer: {
        type: Type.STRING,
        description: 'mcq: 정답 보기 텍스트 / truefalse: "참" 또는 "거짓" / short: 모범답안',
      },
      explanation: { type: Type.STRING, description: '해설 (평문)' },
    },
    required: ['type', 'question', 'answer', 'explanation'],
  },
};

export const FLASHCARDS_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: { type: Type.STRING, description: '앞면: 개념/용어/질문' },
      back: { type: Type.STRING, description: '뒷면: 정의/답' },
    },
    required: ['front', 'back'],
  },
};

export const PODCAST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      speaker: { type: Type.STRING, enum: ['A', 'B'], description: '화자 A 또는 B' },
      text: { type: Type.STRING, description: '한 턴의 대사 (평문, 구어체)' },
    },
    required: ['speaker', 'text'],
  },
};
