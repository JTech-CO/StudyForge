import type { SourceKind } from '../lib/ai/provider';

const EXT_KIND: Record<string, SourceKind> = {
  pdf: 'pdf',
  docx: 'docx',
  hwpx: 'hwpx',
  hwp: 'hwp',
  txt: 'txt',
  md: 'md',
  markdown: 'md',
  // 오디오
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  ogg: 'audio',
  oga: 'audio',
  flac: 'audio',
  weba: 'audio',
  // 영상
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mkv: 'video',
  avi: 'video',
  m4v: 'video',
};

/** 파일 입력 accept 속성용 목록. */
export const ACCEPT_ATTR =
  '.pdf,.docx,.hwpx,.hwp,.txt,.md,.markdown,audio/*,video/*';

/** 확장자 + MIME 으로 소스 종류 판별. 미지원이면 null. */
export function detectKind(file: File): SourceKind | null {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (ext && EXT_KIND[ext]) return EXT_KIND[ext];
  const mime = file.type;
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'text/markdown') return 'md';
  if (mime.startsWith('text/')) return 'txt';
  return null;
}

const YT_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/i;

/** 유튜브 URL 파싱 → { id, url }. 유효하지 않으면 null. */
export function parseYoutube(input: string): { id: string; url: string } | null {
  const url = input.trim();
  if (!url) return null;
  const m = url.match(YT_RE);
  if (!m) return null;
  return { id: m[1], url };
}
