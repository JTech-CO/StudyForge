// 모델 메타데이터 — SDK(@google/genai) 비의존 경량 모듈(메인 번들 안전).
// 모델 문자열은 구현 시점(2026-06) 공식 문서로 확인. 무료 한도: flash 계열 O / pro X.

export interface GeminiModelOption {
  id: string;
  label: string;
  free: boolean;
}

export const GEMINI_MODEL_OPTIONS: GeminiModelOption[] = [
  { id: 'gemini-2.5-flash-lite', label: 'Flash-Lite · 가장 저렴/빠름', free: true },
  { id: 'gemini-2.5-flash', label: 'Flash 2.5 · 가성비', free: true },
  { id: 'gemini-3.5-flash', label: 'Flash 3.5 · 최신·고품질', free: true },
  { id: 'gemini-2.5-pro', label: 'Pro · 심화(무료 한도 없음)', free: false },
];

export const DEFAULT_MODEL = 'gemini-3.5-flash';

// 멀티스피커 TTS (PCM 24kHz/16bit/mono 반환). 모두 preview 계열.
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const DEFAULT_VOICES: { A: string; B: string } = { A: 'Kore', B: 'Puck' };
