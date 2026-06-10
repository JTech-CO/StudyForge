/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_SHARE_WORKER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
