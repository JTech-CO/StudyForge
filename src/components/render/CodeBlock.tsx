import { useEffect, useState } from 'react';
import { highlightCode } from '../../lib/render/shiki';
import { useT } from '../../hooks/useT';

/** Shiki 코드 하이라이팅 + 언어 라벨 + 복사 버튼. 하이라이팅 실패 시 평문 폴백. */
export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const { t } = useT();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    highlightCode(code, lang)
      .then((h) => {
        if (alive) setHtml(h);
      })
      .catch(() => {
        if (alive) setHtml(null);
      });
    return () => {
      alive = false;
    };
  }, [code, lang]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 접근 불가 시 무시 */
    }
  }

  return (
    <div className="sf-code">
      <div className="sf-code__bar">
        <span className="sf-code__lang">{lang}</span>
        <button type="button" onClick={copy} className="sf-code__copy" aria-label={t('code.copyAria')}>
          {copied ? t('common.copied') : t('code.copy')}
        </button>
      </div>
      {html ? (
        <div className="sf-code__body" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="sf-code__body sf-code__body--plain">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
