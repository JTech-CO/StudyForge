import type {
  Flashcard,
  GenerateOptions,
  LLMProvider,
  NotesResult,
  PodcastTurn,
  QuizItem,
  SourceContext,
} from './provider.ts';
import {
  FLASHCARDS_JSON_SCHEMA,
  NOTES_JSON_SCHEMA,
  PODCAST_JSON_SCHEMA,
  QUIZ_JSON_SCHEMA,
  type JsonSchema,
} from './json-schemas.ts';
import {
  parseFlashcards,
  parseNotes,
  parsePodcast,
  parseQuiz,
  stripFences,
} from './parsing.ts';
import {
  flashcardsPrompt,
  mindmapPrompt,
  notesPrompt,
  podcastPrompt,
  quizPrompt,
  structuredSystemInstruction,
  systemInstruction,
} from './prompts.ts';

export abstract class TextGenerationProvider implements LLMProvider {
  abstract readonly name: string;
  readonly maxConcurrency?: number;

  protected abstract complete(
    system: string,
    user: string,
    schema?: JsonSchema,
    schemaName?: string,
  ): Promise<string>;

  private sourcePrompt(ctx: SourceContext[], task: string): string {
    const missingMedia = ctx.find((source) => source.mediaRef && !source.text);
    if (missingMedia) {
      throw new Error(
        '선택한 AI 제공자는 미디어 자료를 직접 읽을 수 없습니다: ' +
          missingMedia.title +
          '. 텍스트 문서를 사용하거나 Gemini로 전환하세요.',
      );
    }
    const sourceText = ctx
      .filter((source) => source.text?.trim())
      .map((source) => '[자료 제목: ' + source.title + ']\n' + source.text)
      .join('\n\n---\n\n');
    if (!sourceText) throw new Error('AI에 전달할 텍스트 자료가 없습니다.');
    return sourceText + '\n\n[작업]\n' + task;
  }

  private structuredPrompt(ctx: SourceContext[], task: string, schema: JsonSchema): string {
    return this.sourcePrompt(
      ctx,
      task +
        '\n\n반드시 설명이나 코드펜스 없이 아래 JSON Schema에 맞는 JSON만 반환하세요.\n' +
        JSON.stringify(schema),
    );
  }

  private async structured<T>(
    ctx: SourceContext[],
    system: string,
    task: string,
    schema: JsonSchema,
    schemaName: string,
    parse: (text: string) => T,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const repair =
        attempt === 0
          ? ''
          : '\n\n이전 응답의 형식이 잘못됐습니다. 누락 필드 없이 유효한 JSON만 다시 반환하세요.';
      const response = await this.complete(
        system,
        this.structuredPrompt(ctx, task + repair, schema),
        schema,
        schemaName,
      );
      try {
        return parse(response);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('구조화 응답을 해석하지 못했습니다.');
  }

  generateNotes(ctx: SourceContext[], opt: GenerateOptions): Promise<NotesResult> {
    return this.structured(
      ctx,
      systemInstruction(opt.locale),
      notesPrompt(opt),
      NOTES_JSON_SCHEMA,
      'studyforge_notes',
      parseNotes,
    );
  }

  async generateMindmap(ctx: SourceContext[], opt: GenerateOptions): Promise<string> {
    const response = await this.complete(
      systemInstruction(opt.locale),
      this.sourcePrompt(ctx, mindmapPrompt(opt)),
    );
    const markdown = stripFences(response);
    if (!markdown) throw new Error('마인드맵 생성 결과가 비어 있습니다.');
    return /^#\s/m.test(markdown) ? markdown : '# 마인드맵\n\n' + markdown;
  }

  generateQuiz(ctx: SourceContext[], opt: GenerateOptions): Promise<QuizItem[]> {
    return this.structured(
      ctx,
      structuredSystemInstruction(opt.locale),
      quizPrompt(opt),
      QUIZ_JSON_SCHEMA,
      'studyforge_quiz',
      parseQuiz,
    );
  }

  generateFlashcards(ctx: SourceContext[], opt: GenerateOptions): Promise<Flashcard[]> {
    return this.structured(
      ctx,
      structuredSystemInstruction(opt.locale),
      flashcardsPrompt(opt),
      FLASHCARDS_JSON_SCHEMA,
      'studyforge_flashcards',
      parseFlashcards,
    );
  }

  generatePodcastScript(ctx: SourceContext[], opt: GenerateOptions): Promise<PodcastTurn[]> {
    return this.structured(
      ctx,
      structuredSystemInstruction(opt.locale),
      podcastPrompt(opt),
      PODCAST_JSON_SCHEMA,
      'studyforge_podcast',
      parsePodcast,
    );
  }
}
