import { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useT } from '../../hooks/useT';
import { Button } from '../ui/Button';

/** markmap 인터랙티브 마인드맵 (줌·접기/펼치기). SVG 내보내기 지원. */
export function MindMap({ markdown }: { markdown: string }) {
  const { t } = useT();
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<{ destroy?: () => void } | null>(null);
  const { resolved } = useTheme();

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [lib, view] = await Promise.all([import('markmap-lib'), import('markmap-view')]);
      if (!alive || !svgRef.current) return;
      const { root } = new lib.Transformer().transform(markdown);
      mmRef.current?.destroy?.();
      svgRef.current.replaceChildren();
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2563eb';
      const mm = view.Markmap.create(
        svgRef.current,
        { color: () => accent, paddingX: 16, duration: 200, spacingVertical: 8, spacingHorizontal: 80 },
        root,
      );
      mmRef.current = mm as unknown as { destroy?: () => void };
      mm.fit();
    })();
    return () => {
      alive = false;
      mmRef.current?.destroy?.();
      mmRef.current = null;
    };
  }, [markdown, resolved]);

  function exportSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const data = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="sf-mindmap">
      <div className="sf-mindmap__bar">
        <Button size="sm" variant="ghost" type="button" onClick={exportSvg}>
          {t('mindmap.saveSvg')}
        </Button>
      </div>
      <svg ref={svgRef} className="sf-mindmap__svg" aria-label={t('artifact.mindmap')} />
    </div>
  );
}
