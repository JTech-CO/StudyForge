import { useStore, type ArtifactKind } from '../../lib/store';
import { useT } from '../../hooks/useT';

const ARTIFACTS: { id: ArtifactKind; labelKey: string }[] = [
  { id: 'notes', labelKey: 'artifact.notes' },
  { id: 'mindmap', labelKey: 'artifact.mindmap' },
  { id: 'quiz', labelKey: 'artifact.quiz' },
  { id: 'flashcards', labelKey: 'artifact.flashcards' },
  { id: 'podcast', labelKey: 'artifact.podcast' },
];

export function ArtifactToggles() {
  const { t } = useT();
  const toggles = useStore((s) => s.settings.toggles);
  const toggleArtifact = useStore((s) => s.toggleArtifact);

  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg">{t('artifacts.legend')}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {ARTIFACTS.map((a) => (
          <label key={a.id} className="cursor-pointer">
            <input
              type="checkbox"
              checked={toggles[a.id]}
              onChange={() => toggleArtifact(a.id)}
              className="peer sr-only"
            />
            <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors duration-100 hover:bg-surface-2 peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {t(a.labelKey)}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{t('artifacts.hint')}</p>
    </fieldset>
  );
}
