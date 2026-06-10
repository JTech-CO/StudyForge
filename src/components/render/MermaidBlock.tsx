import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../hooks/useT';

let seq = 0;

async function renderMermaid(id: string, code: string, dark: boolean): Promise<string> {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'neutral', // 절제된 무채 계열 (안티-클리셰)
    securityLevel: 'strict',
    fontFamily: 'inherit',
  });
  const { svg } = await mermaid.render(id, code);
  return svg;
}

/** Mermaid 다이어그램 — 블록 단위 격리. 파싱 실패 시 원문 코드로 폴백(앱 안전). */
export function MermaidBlock({ code }: { code: string }) {
  const { t } = useT();
  const { resolved } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`sf-mmd-${(seq += 1)}`);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setSvg(null);
    renderMermaid(idRef.current, code, resolved === 'dark')
      .then((s) => {
        if (alive) setSvg(s);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [code, resolved]);

  if (failed) {
    return (
      <div className="sf-code">
        <div className="sf-code__bar">
          <span className="sf-code__lang">{t('mermaid.renderFailed')}</span>
        </div>
        <pre className="sf-code__body sf-code__body--plain">
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  if (!svg) return <div className="sf-mermaid" aria-busy="true" />;
  return <div className="sf-mermaid" role="img" dangerouslySetInnerHTML={{ __html: svg }} />;
}
