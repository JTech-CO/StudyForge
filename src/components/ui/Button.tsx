import type { ButtonHTMLAttributes, Ref } from 'react';
import { cx } from '../../utils/cx';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent/90',
  ghost: 'border border-border bg-transparent text-fg hover:bg-surface-2',
  danger: 'border border-border bg-transparent text-error hover:bg-error/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
