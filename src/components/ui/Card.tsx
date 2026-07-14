import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/**
 * Soft content card on a quiet background: surface contrast and spacing over
 * borders, gentle rounding, whisper of elevation.
 */
export function Card({ title, description, children, className }: CardProps) {
  return (
    <section
      className={cn(
        'chm-card-shadow rounded-[18px] bg-surface-raised p-4',
        className
      )}
    >
      {title || description ? (
        <header className={cn(children ? 'mb-3' : undefined)}>
          {title ? (
            <h2 className="text-base font-bold text-ink">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-ink-secondary">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
