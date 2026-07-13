import { createBundledHighlighter } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const LANGUAGES = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  python: () => import('@shikijs/langs/python'),
  java: () => import('@shikijs/langs/java'),
  c: () => import('@shikijs/langs/c'),
  cpp: () => import('@shikijs/langs/cpp'),
  csharp: () => import('@shikijs/langs/csharp'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  ruby: () => import('@shikijs/langs/ruby'),
  php: () => import('@shikijs/langs/php'),
  sql: () => import('@shikijs/langs/sql'),
  bash: () => import('@shikijs/langs/bash'),
  json: () => import('@shikijs/langs/json'),
  yaml: () => import('@shikijs/langs/yaml'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  markdown: () => import('@shikijs/langs/markdown'),
} as const;

const THEMES = {
  'github-light': () => import('@shikijs/themes/github-light'),
  'github-dark': () => import('@shikijs/themes/github-dark'),
} as const;
const THEME_NAMES = { light: 'github-light', dark: 'github-dark' } as const;

const ALIAS: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', node: 'javascript',
  ts: 'typescript', py: 'python', rb: 'ruby', cs: 'csharp', 'c#': 'csharp',
  'c++': 'cpp', cc: 'cpp', h: 'c', hpp: 'cpp', rs: 'rust',
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', yml: 'yaml',
};

type SupportedLanguage = keyof typeof LANGUAGES;

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return Object.hasOwn(LANGUAGES, lang);
}

const createHighlighter = createBundledHighlighter({
  langs: LANGUAGES,
  themes: THEMES,
  engine: () => createJavaScriptRegexEngine({ forgiving: true }),
});

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;
const languageLoads = new Map<SupportedLanguage, Promise<void>>();

function getHighlighter(): ReturnType<typeof createHighlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [],
  });
  return highlighterPromise;
}

async function ensureLanguage(
  highlighter: Awaited<ReturnType<typeof createHighlighter>>,
  lang: SupportedLanguage,
): Promise<void> {
  if (highlighter.getLoadedLanguages().includes(lang)) return;
  let pending = languageLoads.get(lang);
  if (!pending) {
    pending = highlighter.loadLanguage(lang).finally(() => languageLoads.delete(lang));
    languageLoads.set(lang, pending);
  }
  await pending;
}

/** Converts code to dual-theme HTML. Unsupported languages fall back to plaintext. */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await getHighlighter();
  const normalized = ALIAS[lang.toLowerCase()] ?? lang.toLowerCase();
  if (!isSupportedLanguage(normalized)) {
    return highlighter.codeToHtml(code, { lang: 'text', themes: THEME_NAMES, defaultColor: false });
  }
  await ensureLanguage(highlighter, normalized);
  return highlighter.codeToHtml(code, { lang: normalized, themes: THEME_NAMES, defaultColor: false });
}
