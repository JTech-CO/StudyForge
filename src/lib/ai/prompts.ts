import type { Depth, GenerateOptions, Locale } from './provider';

const DEPTH_GUIDE: Record<Depth, string> = {
  beginner:
    '입문자 대상. 비유와 일상 예시 중심으로 풀어 설명하고, 전문 용어는 처음 등장 시 괄호로 뜻을 덧붙인다. 섹션은 짧게.',
  intermediate: '표준 깊이. 핵심 메커니즘과 원리를 정확히 짚고, 적절한 전문 용어를 사용한다.',
  expert:
    '심화. 정밀하고 완전하게. 수식 유도, 엣지 케이스, 한계와 예외, 관련 심화 주제까지 다룬다.',
};

export function systemInstruction(locale: Locale): string {
  const lang = locale === 'en' ? 'English' : '한국어';
  return `당신은 뛰어난 학습 자료 편집자입니다. 주어진 자료를 바탕으로 ${lang}(으)로 명확하고 정확한 학습 콘텐츠를 만듭니다.

규칙:
- 반드시 ${lang}로 작성한다.
- Markdown 을 사용한다: 명확한 h2/h3 위계, 표는 GFM 표, 수식은 $...$ 와 $$...$$ (KaTeX 문법).
- 코드는 반드시 언어 태그를 붙인 펜스 블록으로 보존한다 (예: \`\`\`python). 언어를 모르면 \`\`\`text.
- 다이어그램/순서도가 이해를 도우면 \`\`\`mermaid 블록(flowchart TD 등)을 문법 오류 없이 사용한다.
- 자료에 없는 사실을 지어내지 않는다. 자료가 부실하면 그 범위 안에서만 작성한다.
- 장식용 이모지나 과장된 표현을 쓰지 않는다.`;
}

export function notesPrompt(opt: GenerateOptions): string {
  return `위 자료로 학습 노트를 만들어 스키마에 맞는 JSON 으로 반환하세요.

- summaryMd: 핵심을 간추린 요약본(Markdown).
- detailedMd: 상세 노트(Markdown). ${DEPTH_GUIDE[opt.depth]}

두 버전 모두 문서 제목(h1)은 넣지 말고 h2 부터 시작합니다. 코드가 포함된 주제라면 반드시 언어 태그가 붙은 코드블록으로 제시하세요.`;
}

export function mindmapPrompt(_opt: GenerateOptions): string {
  return `위 자료의 핵심 구조를 마인드맵용 계층형 Markdown 아웃라인으로 만들어 주세요.

규칙:
- 정확히 하나의 최상위 제목으로 시작: "# <전체 주제>"
- 그 아래 들여쓰기된 불릿(-)으로 2~4단계 계층 구성. 각 노드는 짧은 구나 단어로.
- 전체 40~60개 노드 내외. 코드블록·표·수식·굵게 표시 없이 순수 아웃라인만.
- 설명 문장 없이 Markdown 아웃라인만 출력하세요.`;
}

/** 퀴즈·플래시카드 등 구조화(JSON) 콘텐츠용 — 평문 위주, 마크다운 강조 없음. */
export function structuredSystemInstruction(locale: Locale): string {
  const lang = locale === 'en' ? 'English' : '한국어';
  return `당신은 학습 평가 콘텐츠 제작자입니다. 주어진 자료로 ${lang}(으)로 정확한 퀴즈/카드를 만듭니다.

규칙:
- 반드시 ${lang}로 작성하고, 자료에 근거해서만(없는 내용 지어내지 않음).
- 답과 해설은 간결한 평문으로(불필요한 마크다운/코드펜스/장식 금지).`;
}

export function quizPrompt(opt: GenerateOptions): string {
  return `위 자료로 학습 퀴즈를 만들어 스키마에 맞는 JSON 배열로 반환하세요.

- 10문항 내외. 객관식(mcq)·단답(short)·참거짓(truefalse)을 골고루 섞을 것.
- mcq: options 에 보기를 정확히 4개 넣고, answer 는 정답 보기의 텍스트와 정확히 일치시킬 것.
- truefalse: answer 는 "참" 또는 "거짓".
- short: answer 는 핵심 모범답안을 짧게.
- 각 문항에 explanation(해설)을 포함. 난이도: ${DEPTH_GUIDE[opt.depth]}`;
}

export function flashcardsPrompt(opt: GenerateOptions): string {
  return `위 자료로 플래시카드를 만들어 스키마에 맞는 JSON 배열로 반환하세요.

- 20장 내외. front 는 개념/용어/질문, back 은 정의/답.
- 한 장에 하나의 개념만. 양면 모두 간결하게.
- 수준: ${DEPTH_GUIDE[opt.depth]}`;
}

export function podcastPrompt(opt: GenerateOptions): string {
  return `위 자료로 두 진행자의 자연스러운 팟캐스트 대담 스크립트를 만들어 스키마에 맞는 JSON 배열로 반환하세요.

- 화자 A(질문·정리 진행역)와 B(설명·전문가역)가 번갈아 대화. 12~24턴 내외.
- 흐름: 주제 소개 → 핵심 개념 설명 → 예시/비유 → 마무리 요약.
- 구어체로 자연스럽게(낭독용). 각 턴은 1~3문장, 평문(마크다운·이모지·무대지문 없이).
- 자료에 근거해서만. 수준: ${DEPTH_GUIDE[opt.depth]}`;
}
