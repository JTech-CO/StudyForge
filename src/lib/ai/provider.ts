// 핵심 추상화 (docs/HARNESS.md §3.3) — 텍스트·구조화 생성은 LLMProvider 뒤에,
// 미디어(전사·TTS)는 MediaProvider 뒤에 둔다. Gemini→Claude/OpenAI 교체 가능.

export type SourceKind =
  | 'text'
  | 'pdf'
  | 'docx'
  | 'hwp'
  | 'hwpx'
  | 'txt'
  | 'md'
  | 'youtube'
  | 'audio'
  | 'video';

export interface MediaRef {
  youtubeUrl?: string; // Gemini 네이티브 처리
  fileUri?: string; // Gemini File API 업로드 결과
  mimeType?: string;
}

export interface SourceContext {
  id: string;
  kind: SourceKind;
  title: string;
  text?: string; // 문서류: 추출된 정규화 텍스트
  mediaRef?: MediaRef; // 미디어류: 프로바이더가 직접 소비
  meta?: Record<string, unknown>;
}

export type Depth = 'beginner' | 'intermediate' | 'expert';
export type Locale = 'ko' | 'en';

export interface GenerateOptions {
  depth: Depth;
  locale: Locale;
}

export interface NotesResult {
  summaryMd: string;
  detailedMd: string;
}

export interface QuizItem {
  type: 'mcq' | 'short' | 'truefalse';
  question: string;
  options?: string[]; // mcq
  answer: string;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface PodcastTurn {
  speaker: 'A' | 'B';
  text: string;
}

// 텍스트·구조화 생성 — 교체 가능(Gemini→Claude→OpenAI). 구현은 M2.
export interface LLMProvider {
  readonly name: string;
  generateNotes(ctx: SourceContext[], opt: GenerateOptions): Promise<NotesResult>;
  generateMindmap(ctx: SourceContext[], opt: GenerateOptions): Promise<string>; // markmap용 MD 아웃라인
  generateQuiz(ctx: SourceContext[], opt: GenerateOptions): Promise<QuizItem[]>;
  generateFlashcards(ctx: SourceContext[], opt: GenerateOptions): Promise<Flashcard[]>;
  generatePodcastScript(ctx: SourceContext[], opt: GenerateOptions): Promise<PodcastTurn[]>;
}

// 미디어 — 현재 Gemini 고정, pluggable. 구현은 M2/M4.
export interface MediaProvider {
  readonly name: string;
  // 유튜브/파일은 SourceContext.mediaRef 로 전달되어 생성 시점에 함께 소비됨.
  // 별도 사전 전사가 필요할 때만 사용.
  transcribe?(ref: MediaRef): Promise<string>;
  synthesizeDialogue(turns: PodcastTurn[], voices: { A: string; B: string }): Promise<Blob>; // WAV/MP3
}
