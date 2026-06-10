import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from './MermaidBlock';

const components: Components = {
  // 펜스 코드는 CodeBlock 이 자체 컨테이너를 제공하므로 기본 <pre> 래퍼를 푼다.
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children }) {
    const text = String(children ?? '');
    const match = /language-([\w-]+)/.exec(className ?? '');
    const isBlock = !!match || text.includes('\n');
    if (!isBlock) return <code className="sf-inline-code">{children}</code>;
    const lang = (match?.[1] ?? 'text').toLowerCase();
    const code = text.replace(/\n$/, '');
    if (lang === 'mermaid') return <MermaidBlock code={code} />;
    return <CodeBlock lang={lang} code={code} />;
  },
};

/**
 * 콘텐츠 충실 렌더: GFM 표 + KaTeX 수식 + Shiki 코드 + Mermaid.
 * react-markdown 사용으로 XSS 살균. 위험 블록은 각자 격리 처리.
 */
export function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div className="sf-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: 'var(--error)' }]]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
