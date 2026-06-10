import { GoogleGenAI, Modality } from '@google/genai';
import type { Content, Part } from '@google/genai';
import type {
  Flashcard,
  GenerateOptions,
  LLMProvider,
  MediaProvider,
  NotesResult,
  PodcastTurn,
  QuizItem,
  SourceContext,
} from './provider';
import { DEFAULT_MODEL, TTS_MODEL } from './models';
import { FLASHCARDS_SCHEMA, NOTES_SCHEMA, PODCAST_SCHEMA, QUIZ_SCHEMA } from './schemas';
import {
  flashcardsPrompt,
  mindmapPrompt,
  notesPrompt,
  podcastPrompt,
  quizPrompt,
  structuredSystemInstruction,
  systemInstruction,
} from './prompts';
import { base64ToBytes, chunkTurns, parseSampleRate, pcmToWav } from './audio';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 모델이 코드펜스로 감싸 반환한 경우 벗겨낸다. */
function stripFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```[\w-]*\s*\n([\s\S]*?)\n?```$/);
  return (m ? m[1] : t).trim();
}

/** Gemini 오류 → 사용자 친화 메시지 (HARNESS 런북 §7). */
function friendlyGeminiError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/RESOURCE_EXHAUSTED|prepayment|credits|\bbilling\b/i.test(msg)) {
    return 'Gemini 크레딧/사용 한도가 소진됐습니다. AI Studio(aistudio.google.com)에서 결제·할당량을 확인해 충전하거나, 결제가 설정되지 않은 프로젝트의 키(무료 한도)를 사용하세요. 설정에서 더 가벼운 모델로 바꿔볼 수도 있습니다.';
  }
  if (/\b429\b|quota|rate limit|too many/i.test(msg)) {
    return 'Gemini 요청 한도(분당/일일)를 초과했습니다. 잠시 후 다시 시도하거나, 설정에서 더 가벼운 모델(Flash-Lite)을 선택해 주세요.';
  }
  if (/API[_ ]?KEY|api key not valid|PERMISSION_DENIED|\b401\b|\b403\b/i.test(msg)) {
    return 'API 키가 유효하지 않거나 권한이 없습니다. 설정에서 키를 다시 확인해 주세요.';
  }
  if (/SAFETY|\bblocked\b|finishReason/i.test(msg)) {
    return '안전 정책 또는 응답 형식 문제로 생성이 차단되었습니다. 자료를 조정해 다시 시도해 주세요.';
  }
  return `생성 중 오류가 발생했습니다: ${msg}`;
}

export class GeminiProvider implements LLMProvider, MediaProvider {
  readonly name = 'gemini';
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    if (!apiKey.trim()) throw new Error('Gemini API 키가 없습니다. 설정에서 키를 입력하세요.');
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  /** 소스를 Gemini contents 로 변환. 미디어는 텍스트 대신 fileData 로 직접 전달. */
  private buildContents(ctx: SourceContext[], prompt: string): Content[] {
    const parts: Part[] = [];
    for (const s of ctx) {
      if (s.mediaRef?.youtubeUrl) {
        parts.push({ fileData: { fileUri: s.mediaRef.youtubeUrl } });
      } else if (s.mediaRef?.fileUri) {
        parts.push({ fileData: { fileUri: s.mediaRef.fileUri, mimeType: s.mediaRef.mimeType } });
      } else if (s.text) {
        parts.push({ text: `[자료 제목: ${s.title}]\n${s.text}` });
      }
    }
    parts.push({ text: prompt });
    return [{ role: 'user', parts }];
  }

  /** 일시 오류(503/네트워크)는 지수 백오프 재시도, 그 외(쿼터/키/안전)는 친절 메시지로 변환. */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        const hardQuota = /RESOURCE_EXHAUSTED|prepayment|credits/i.test(msg);
        const transient = /UNAVAILABLE|overloaded|deadline|\b50[0-9]\b|ECONNRESET|network|fetch failed/i.test(msg);
        if (transient && !hardQuota && attempt < 2) {
          await sleep(600 * 2 ** attempt);
          continue;
        }
        throw new Error(friendlyGeminiError(e));
      }
    }
    throw new Error(friendlyGeminiError(lastErr));
  }

  async generateNotes(ctx: SourceContext[], opt: GenerateOptions): Promise<NotesResult> {
    const params = {
      model: this.model,
      contents: this.buildContents(ctx, notesPrompt(opt)),
      config: {
        systemInstruction: systemInstruction(opt.locale),
        responseMimeType: 'application/json',
        responseSchema: NOTES_SCHEMA,
        temperature: 0.4,
      },
    };
    // responseSchema 강제 + 파싱 실패 시 1회 재시도(리페어)
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const res = await this.withRetry(() => this.ai.models.generateContent(params));
      try {
        const obj = JSON.parse(stripFences(res.text ?? '')) as Partial<NotesResult>;
        if (obj.summaryMd || obj.detailedMd) {
          return {
            summaryMd: obj.summaryMd ?? obj.detailedMd ?? '',
            detailedMd: obj.detailedMd ?? obj.summaryMd ?? '',
          };
        }
      } catch {
        // 다음 시도로
      }
    }
    throw new Error('노트 생성 결과(JSON) 파싱에 실패했습니다. 다시 시도해 주세요.');
  }

  async generateMindmap(ctx: SourceContext[], opt: GenerateOptions): Promise<string> {
    const res = await this.withRetry(() =>
      this.ai.models.generateContent({
        model: this.model,
        contents: this.buildContents(ctx, mindmapPrompt(opt)),
        config: { systemInstruction: systemInstruction(opt.locale), temperature: 0.3 },
      }),
    );
    const md = stripFences(res.text ?? '');
    if (!md.trim()) throw new Error('마인드맵 생성 결과가 비어 있습니다.');
    return /^#\s/m.test(md) ? md : `# 마인드맵\n\n${md}`;
  }

  /** 배열형 구조화 출력 공통(퀴즈/플래시카드) — 스키마 강제 + 파싱 1회 리페어. */
  private async generateArray<T>(
    ctx: SourceContext[],
    opt: GenerateOptions,
    prompt: string,
    schema: object,
    isValid: (x: Partial<T>) => boolean,
  ): Promise<T[]> {
    const params = {
      model: this.model,
      contents: this.buildContents(ctx, prompt),
      config: {
        systemInstruction: structuredSystemInstruction(opt.locale),
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.5,
      },
    };
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const res = await this.withRetry(() => this.ai.models.generateContent(params));
      try {
        const parsed = JSON.parse(stripFences(res.text ?? ''));
        if (Array.isArray(parsed)) {
          const items = (parsed as Partial<T>[]).filter(isValid) as T[];
          if (items.length > 0) return items;
        }
      } catch {
        // 다음 시도로
      }
    }
    throw new Error('생성 결과(JSON 배열) 파싱에 실패했습니다. 다시 시도해 주세요.');
  }

  async generateQuiz(ctx: SourceContext[], opt: GenerateOptions): Promise<QuizItem[]> {
    return this.generateArray<QuizItem>(
      ctx,
      opt,
      quizPrompt(opt),
      QUIZ_SCHEMA,
      (q) => !!q.type && !!q.question && !!q.answer,
    );
  }

  async generateFlashcards(ctx: SourceContext[], opt: GenerateOptions): Promise<Flashcard[]> {
    return this.generateArray<Flashcard>(
      ctx,
      opt,
      flashcardsPrompt(opt),
      FLASHCARDS_SCHEMA,
      (c) => !!c.front && !!c.back,
    );
  }

  async generatePodcastScript(ctx: SourceContext[], opt: GenerateOptions): Promise<PodcastTurn[]> {
    return this.generateArray<PodcastTurn>(
      ctx,
      opt,
      podcastPrompt(opt),
      PODCAST_SCHEMA,
      (t) => (t.speaker === 'A' || t.speaker === 'B') && !!t.text,
    );
  }

  /** 멀티스피커 TTS — 턴을 청크 합성 후 PCM 스티칭 → WAV Blob (MediaProvider). */
  async synthesizeDialogue(turns: PodcastTurn[], voices: { A: string; B: string }): Promise<Blob> {
    if (turns.length === 0) throw new Error('대담 스크립트가 비어 있습니다.');
    const pcmParts: Uint8Array[] = [];
    let sampleRate = 24000;
    for (const chunk of chunkTurns(turns)) {
      const text = chunk.map((t) => `${t.speaker}: ${t.text}`).join('\n');
      const res = await this.withRetry(() =>
        this.ai.models.generateContent({
          model: TTS_MODEL,
          contents: [{ role: 'user', parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  { speaker: 'A', voiceConfig: { prebuiltVoiceConfig: { voiceName: voices.A } } },
                  { speaker: 'B', voiceConfig: { prebuiltVoiceConfig: { voiceName: voices.B } } },
                ],
              },
            },
          },
        }),
      );
      const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      const inline = part?.inlineData;
      if (!inline?.data) throw new Error('TTS 응답에 오디오 데이터가 없습니다.');
      sampleRate = parseSampleRate(inline.mimeType);
      pcmParts.push(base64ToBytes(inline.data));
    }
    return pcmToWav(pcmParts, sampleRate);
  }
}
