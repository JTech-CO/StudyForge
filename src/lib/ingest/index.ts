import type { SourceContext } from '../ai/provider';
import { newId } from '../../utils/id';
import { makeTitle } from '../../utils/format';
import { detectKind, parseYoutube } from '../../utils/validate';

/** 인제스트 실패 — 사용자에게 그대로 노출할 메시지를 담는다. */
export class IngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IngestError';
  }
}

export interface IngestResult {
  context: SourceContext;
  warning?: string;
}

/** 텍스트 직접 입력. */
export function ingestText(text: string, title?: string): SourceContext {
  const t = text.trim();
  if (!t) throw new IngestError('빈 텍스트입니다.');
  return { id: newId(), kind: 'text', title: title?.trim() || makeTitle(t), text: t };
}

/** 유튜브 URL → mediaRef.youtubeUrl 래핑 (다운로드 없음, Gemini 네이티브). */
export function ingestYoutube(url: string): SourceContext {
  const yt = parseYoutube(url);
  if (!yt) {
    throw new IngestError('유효한 유튜브 URL 이 아닙니다. 공개 영상의 watch/shorts/youtu.be 링크를 넣어주세요.');
  }
  return {
    id: newId(),
    kind: 'youtube',
    title: `YouTube · ${yt.id}`,
    mediaRef: { youtubeUrl: yt.url },
    meta: { youtubeId: yt.id },
  };
}

function toMessage(e: unknown): string {
  if (e instanceof IngestError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return '파일을 처리하는 중 오류가 발생했습니다.';
}

/**
 * 파일 → SourceContext. 무거운 추출기는 동적 import 로 코드 스플리팅.
 * 모든 실패는 IngestError 로 변환해 사용자에게 노출(앱 크래시 없음).
 */
export async function ingestFile(
  file: File,
  opts: { apiKey?: string; signal?: AbortSignal } = {},
): Promise<IngestResult> {
  const kind = detectKind(file);
  if (!kind) {
    throw new IngestError(`지원하지 않는 형식입니다: ${file.name}`);
  }

  const base: SourceContext = {
    id: newId(),
    kind,
    title: file.name,
    meta: { size: file.size, mime: file.type },
  };

  try {
    switch (kind) {
      case 'txt':
      case 'md': {
        const text = (await file.text()).trim();
        if (!text) throw new IngestError('파일이 비어 있습니다.');
        return { context: { ...base, text } };
      }
      case 'pdf': {
        const { extractPdf } = await import('./pdf');
        const text = await extractPdf(file);
        const warning =
          text.trim().length < 20
            ? '추출된 텍스트가 거의 없습니다. 스캔 PDF 일 수 있어요(텍스트 레이어 없음 · OCR 미지원).'
            : undefined;
        return { context: { ...base, text }, warning };
      }
      case 'docx': {
        const { extractDocx } = await import('./docx');
        const text = await extractDocx(file);
        if (!text) throw new IngestError('DOCX 에서 텍스트를 찾지 못했습니다.');
        return { context: { ...base, text } };
      }
      case 'hwpx': {
        const { extractHwpx } = await import('./hwp');
        const text = await extractHwpx(file);
        return { context: { ...base, text } };
      }
      case 'hwp': {
        // best-effort → 실패 시 변환 안내로 강등
        try {
          const { extractHwp5 } = await import('./hwp');
          const text = await extractHwp5(file);
          return { context: { ...base, text } };
        } catch {
          throw new IngestError(
            'HWP(5.0) 텍스트 추출에 실패했습니다. PDF 또는 HWPX 로 변환해 다시 올려주세요.',
          );
        }
      }
      case 'audio':
      case 'video': {
        const { uploadMedia } = await import('./media');
        const mediaRef = await uploadMedia(file, opts.apiKey ?? '', opts.signal);
        return { context: { ...base, mediaRef } };
      }
      default:
        throw new IngestError(`지원하지 않는 형식입니다: ${file.name}`);
    }
  } catch (e) {
    throw new IngestError(toMessage(e));
  }
}
