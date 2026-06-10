import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

/** 토큰 기반 카드 — 보더 + 표면색, 그림자 최소(디자인 백서 §5.2). */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-lg border border-border bg-surface', className)} {...rest} />;
}
