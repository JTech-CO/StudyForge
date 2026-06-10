import { useState } from 'react';
import type { Flashcard } from '../../lib/ai/provider';
import { Button } from '../ui/Button';
import { cx } from '../../utils/cx';
import { useT } from '../../hooks/useT';

export function Flashcards({ cards }: { cards: Flashcard[] }) {
  const { t } = useT();
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(() => new Set());

  const idx = order[pos] ?? 0;
  const card = cards[idx];

  function go(delta: number) {
    setFlipped(false);
    setPos((p) => (p + delta + cards.length) % cards.length);
  }

  function shuffle() {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setPos(0);
    setFlipped(false);
  }

  function mark(isKnown: boolean) {
    setKnown((prev) => {
      const next = new Set(prev);
      if (isKnown) next.add(idx);
      else next.delete(idx);
      return next;
    });
    go(1);
  }

  if (!card) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {pos + 1} / {cards.length}
        </span>
        <span>{t('flash.knownCount', { n: known.size })}</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? t('flash.frontAria') : t('flash.flipAria')}
        aria-pressed={flipped}
        className="sf-card block w-full"
      >
        <div className={cx('sf-card__inner', flipped && 'sf-card__inner--flipped')}>
          <div className="sf-card__face">
            <span className="text-xs uppercase tracking-wide text-muted">{t('flash.front')}</span>
            <p className="mt-2 text-lg font-medium text-fg">{card.front}</p>
            <span className="mt-4 text-xs text-muted">{t('flash.flipHint')}</span>
          </div>
          <div className="sf-card__face sf-card__face--back">
            <span className="text-xs uppercase tracking-wide text-muted">{t('flash.back')}</span>
            <p className="mt-2 whitespace-pre-wrap text-base text-fg">{card.back}</p>
          </div>
        </div>
      </button>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => mark(false)}>
          {t('flash.unknown')}
        </Button>
        <Button type="button" className="flex-1" onClick={() => mark(true)}>
          {t('flash.known')}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => go(-1)}>
          {t('flash.prev')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={shuffle}>
          {t('flash.shuffle')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => go(1)}>
          {t('flash.next')}
        </Button>
      </div>
    </div>
  );
}
