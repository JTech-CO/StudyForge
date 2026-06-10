import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** reading = 72ch 읽기 폭(기본), wide = 넓은 폼/그리드 */
  width?: 'reading' | 'wide';
}

export function Container({ width = 'reading', className, ...rest }: ContainerProps) {
  return (
    <div
      className={cx(
        'mx-auto w-full px-4 sm:px-6',
        width === 'wide' ? 'max-w-5xl' : 'max-w-reading',
        className,
      )}
      {...rest}
    />
  );
}
