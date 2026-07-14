import { cn } from '@/lib/cn';

type AvatarProps = {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9 rounded-[11px] text-sm',
  md: 'h-10 w-10 rounded-[13px] text-sm',
  lg: 'h-[50px] w-[50px] rounded-[25px] text-lg',
};

/**
 * Initials avatar in the redesign's rounded-square style (accent-soft bg,
 * accent text). `lg` uses a full circle to match the Settings profile card.
 */
export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-accent-soft font-extrabold text-accent',
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
