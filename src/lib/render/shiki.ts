// fine-grained + JS 정규식 엔진(wasm 불필요 → dev/prod 모두 안정, 번들도 최소).
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import githubLight from '@shikijs/themes/github-light';
import githubDark from '@shikijs/themes/github-dark';
import javascript from '@shikijs/langs/javascript';
import typescript from '@shikijs/langs/typescript';
import jsx from '@shikijs/langs/jsx';
import tsx from '@shikijs/langs/tsx';
import python from '@shikijs/langs/python';
import java from '@shikijs/langs/java';
import c from '@shikijs/langs/c';
import cpp from '@shikijs/langs/cpp';
import csharp from '@shikijs/langs/csharp';
import go from '@shikijs/langs/go';
import rust from '@shikijs/langs/rust';
import ruby from '@shikijs/langs/ruby';
import php from '@shikijs/langs/php';
import sql from '@shikijs/langs/sql';
import bash from '@shikijs/langs/bash';
import json from '@shikijs/langs/json';
import yaml from '@shikijs/langs/yaml';
import htmlLang from '@shikijs/langs/html';
import cssLang from '@shikijs/langs/css';
import markdown from '@shikijs/langs/markdown';

const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

const ALIAS: Record<string, string> = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', node: 'javascript',
  ts: 'typescript', py: 'python', rb: 'ruby', cs: 'csharp', 'c#': 'csharp',
  'c++': 'cpp', cc: 'cpp', h: 'c', hpp: 'cpp', rs: 'rust',
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', yml: 'yaml',
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight, githubDark],
      langs: [
        javascript, typescript, jsx, tsx, python, java, c, cpp, csharp, go,
        rust, ruby, php, sql, bash, json, yaml, htmlLang, cssLang, markdown,
      ],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  }
  return highlighterPromise;
}

/** 코드 → 듀얼 테마 HTML(라이트/다크 CSS 변수). 미지원 언어는 plaintext 로 폴백. */
export async function highlightCode(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter();
  const normalized = ALIAS[lang] ?? lang;
  const useLang = hl.getLoadedLanguages().includes(normalized) ? normalized : 'text';
  return hl.codeToHtml(code, { lang: useLang, themes: THEMES, defaultColor: false });
}
