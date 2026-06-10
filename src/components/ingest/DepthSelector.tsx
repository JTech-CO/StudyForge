import { useStore } from '../../lib/store';
import type { Depth } from '../../lib/ai/provider';
import { useT } from '../../hooks/useT';

const DEPTHS: { id: Depth; labelKey: string; descKey: string }[] = [
  { id: 'beginner', labelKey: 'depth.beginner', descKey: 'depth.beginnerDesc' },
  { id: 'intermediate', labelKey: 'depth.intermediate', descKey: 'depth.intermediateDesc' },
  { id: 'expert', labelKey: 'depth.expert', descKey: 'depth.expertDesc' },
];

export function DepthSelector() {
  const { t } = useT();
  const depth = useStore((s) => s.settings.depth);
  const setDepth = useStore((s) => s.setDepth);

  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg">{t('depth.legend')}</legend>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DEPTHS.map((d) => (
          <label key={d.id} className="cursor-pointer">
            <input
              type="radio"
              name="depth"
              value={d.id}
              checked={depth === d.id}
              onChange={() => setDepth(d.id)}
              className="peer sr-only"
            />
            <span className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2 transition-colors duration-100 hover:bg-surface-2 peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              <span className="text-sm font-medium text-fg">{t(d.labelKey)}</span>
              <span className="text-xs text-muted">{t(d.descKey)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
