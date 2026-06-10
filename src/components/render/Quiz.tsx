import { useMemo, useState } from 'react';
import type { QuizItem } from '../../lib/ai/provider';
import { Button } from '../ui/Button';
import { cx } from '../../utils/cx';
import { useT } from '../../hooks/useT';

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// 참/거짓을 locale 무관하게 불리언으로 매핑 (보기 표시는 번역, 정답은 '참/거짓'일 수 있음)
function tfBool(s: string): boolean | null {
  const n = s.trim().toLowerCase();
  if (['참', 'true', 't', 'o', 'yes', '예'].includes(n)) return true;
  if (['거짓', 'false', 'f', 'x', 'no', '아니오'].includes(n)) return false;
  return null;
}

function isCorrect(item: QuizItem, given: string): boolean {
  if (!given.trim()) return false;
  if (item.type === 'truefalse') {
    const g = tfBool(given);
    return g !== null && g === tfBool(item.answer);
  }
  if (item.type === 'short') {
    const a = normalize(item.answer);
    const g = normalize(given);
    return g === a || a.includes(g) || g.includes(a);
  }
  return normalize(given) === normalize(item.answer);
}

function matchesAnswer(item: QuizItem, opt: string): boolean {
  if (item.type === 'truefalse') return tfBool(opt) === tfBool(item.answer);
  return normalize(opt) === normalize(item.answer);
}

interface ChoiceProps {
  name: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  submitted: boolean;
  isAnswer: boolean;
  inline?: boolean;
}

function Choice({ name, value, checked, disabled, onChange, submitted, isAnswer, inline }: ChoiceProps) {
  const tone =
    submitted && isAnswer
      ? 'border-success bg-success/10'
      : submitted && checked && !isAnswer
        ? 'border-error bg-error/10'
        : checked
          ? 'border-accent bg-accent/10'
          : 'border-border hover:bg-surface-2';
  return (
    <label className={cx('cursor-pointer', inline && 'flex-1')}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cx(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-fg transition-colors duration-100',
          inline && 'justify-center',
          tone,
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
        )}
      >
        {value}
      </span>
    </label>
  );
}

export function Quiz({ items }: { items: QuizItem[] }) {
  const { t } = useT();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => items.reduce((n, it, i) => n + (isCorrect(it, answers[i] ?? '') ? 1 : 0), 0),
    [items, answers],
  );
  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;

  function setAnswer(i: number, v: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [i]: v }));
  }

  return (
    <div className="flex flex-col gap-5">
      {submitted && (
        <div
          className="rounded-lg border border-border bg-surface-2 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-fg">
            {t('quiz.score', { score, total: items.length })}
          </p>
        </div>
      )}

      <ol className="flex flex-col gap-5">
        {items.map((item, i) => {
          const given = answers[i] ?? '';
          const correct = isCorrect(item, given);
          const choices = item.type === 'truefalse' ? [t('quiz.true'), t('quiz.false')] : item.options ?? [];
          return (
            <li key={i} className="rounded-lg border border-border bg-surface p-4">
              <fieldset>
                <legend className="mb-3 flex gap-2 text-sm font-medium text-fg">
                  <span className="text-muted">{i + 1}.</span>
                  <span>{item.question}</span>
                </legend>

                {item.type === 'short' ? (
                  <input
                    type="text"
                    value={given}
                    disabled={submitted}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    placeholder={t('quiz.shortPlaceholder')}
                    aria-label={t('quiz.shortAria', { n: i + 1 })}
                    className={cx(
                      'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:border-accent',
                      submitted ? (correct ? 'border-success' : 'border-error') : 'border-border',
                    )}
                  />
                ) : (
                  <div className={cx('flex gap-2', item.type === 'mcq' ? 'flex-col' : 'flex-row')}>
                    {choices.map((opt, oi) => (
                      <Choice
                        key={oi}
                        name={`q${i}`}
                        value={opt}
                        checked={given === opt}
                        disabled={submitted}
                        onChange={() => setAnswer(i, opt)}
                        submitted={submitted}
                        isAnswer={matchesAnswer(item, opt)}
                        inline={item.type === 'truefalse'}
                      />
                    ))}
                  </div>
                )}

                {submitted && (
                  <div className="mt-3 text-sm">
                    <p className={cx('font-medium', correct ? 'text-success' : 'text-error')}>
                      {correct ? t('quiz.correct') : t('quiz.wrong')}
                      {!correct && <span className="text-muted"> · {t('quiz.answerIs', { answer: item.answer })}</span>}
                    </p>
                    {item.explanation && (
                      <p className="mt-1 whitespace-pre-wrap text-muted">{item.explanation}</p>
                    )}
                  </div>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3">
        {submitted ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            {t('quiz.retry')}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => setSubmitted(true)} disabled={answeredCount === 0}>
              {t('quiz.grade')}
            </Button>
            <span className="text-xs text-muted">
              {t('quiz.answered', { n: answeredCount, total: items.length })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
