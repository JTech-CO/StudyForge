import type { PodcastTurn } from './provider';

/** base64 → 바이트 배열 */
export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** mimeType("audio/L16;rate=24000")에서 샘플레이트 추출 (기본 24000) */
export function parseSampleRate(mimeType?: string): number {
  const m = mimeType?.match(/rate=(\d+)/i);
  return m ? Number(m[1]) : 24000;
}

/** 16-bit PCM(mono) 청크들을 하나의 WAV Blob 으로 인코딩(스티칭). */
export function pcmToWav(pcmChunks: Uint8Array[], sampleRate: number): Blob {
  const dataLength = pcmChunks.reduce((n, c) => n + c.length, 0);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);
  const out = new Uint8Array(buffer);
  let offset = 44;
  for (const chunk of pcmChunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** TTS 입력 길이 제한 회피: 대담 턴을 글자 수 기준으로 청크 분할. */
export function chunkTurns(turns: PodcastTurn[], maxChars = 1800): PodcastTurn[][] {
  const chunks: PodcastTurn[][] = [];
  let cur: PodcastTurn[] = [];
  let len = 0;
  for (const t of turns) {
    const tlen = t.text.length + 4;
    if (len + tlen > maxChars && cur.length > 0) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(t);
    len += tlen;
  }
  if (cur.length > 0) chunks.push(cur);
  return chunks;
}
