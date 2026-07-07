import { cn } from '@/lib/cn';

type SkeletonProps = {
  className?: string;
};

/**
 * Loading placeholder block. Shape it like the content it precedes so the
 * layout never jumps; spinners belong only inside buttons.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-surface-sunken motion-reduce:animate-none',
        className
      )}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

/** Stacked text-line placeholders; the last line is shorter. */
export function SkeletonText({ lines = 2, className }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

type SkeletonCircleProps = {
  className?: string;
};

/** Circular placeholder for avatars and icon slots. */
export function SkeletonCircle({ className }: SkeletonCircleProps) {
  return <Skeleton className={cn('h-10 w-10 rounded-full', className)} />;
}
