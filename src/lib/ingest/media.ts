import { GoogleGenAI } from '@google/genai';
import type { MediaRef } from '../ai/provider';

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * 오디오·영상 → Gemini File API 업로드 → { fileUri }.
 * 대용량은 SDK 가 resumable 처리. PROCESSING → ACTIVE 까지 best-effort 대기.
 */
export async function uploadMedia(
  file: File,
  apiKey: string,
  signal?: AbortSignal,
): Promise<MediaRef> {
  if (!apiKey.trim()) {
    throw new Error('오디오·영상 업로드에는 Gemini API 키가 필요합니다. 설정에서 키를 입력하세요.');
  }

  const ai = new GoogleGenAI({ apiKey });
  let info = await ai.files.upload({
    file,
    config: {
      mimeType: file.type || undefined,
      displayName: file.name,
      abortSignal: signal,
    },
  });

  // Poll for up to about 60 seconds and require the final ACTIVE state.
  for (let i = 0; i < 30; i += 1) {
    const state = String(info.state ?? '').toUpperCase();
    if (state.includes('ACTIVE')) break;
    if (state.includes('FAIL')) throw new Error('Gemini 가 업로드한 파일 처리에 실패했습니다.');
    if (!info.name) break;
    await sleep(2000, signal);
    info = await ai.files.get({ name: info.name, config: { abortSignal: signal } });
  }

  if (!info.uri) throw new Error('업로드된 파일의 URI 를 받지 못했습니다.');
  const finalState = String(info.state ?? '').toUpperCase();
  if (finalState && !finalState.includes('ACTIVE')) {
    throw new Error('Gemini file processing timed out. Please upload the file again shortly.');
  }
  return { fileUri: info.uri, mimeType: info.mimeType ?? file.type ?? undefined };
}
