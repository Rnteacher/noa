import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatusVariant = 'positive' | 'caution' | 'critical';

type StatusBadgeProps = {
  variant: StatusVariant;
  /** Accessible status label; callers pass a translated string. */
  label: string;
  /** Collapses the badge to glyph-only; the label stays for screen readers. */
  hideLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

/*
 * Each variant pairs its color with a distinct glyph shape (circle /
 * triangle / octagon) so status never relies on color alone.
 */
const VARIANT_STYLES: Record<
  StatusVariant,
  { icon: typeof CircleCheck; classes: string }
> = {
  positive: {
    icon: CircleCheck,
    classes: 'bg-status-positive-soft text-status-positive',
  },
  caution: {
    icon: TriangleAlert,
    classes: 'bg-status-caution-soft text-status-caution',
  },
  critical: {
    icon: OctagonAlert,
    classes: 'bg-status-critical-soft text-status-critical',
  },
};

export function StatusBadge({
  variant,
  label,
  hideLabel = false,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const { icon: Icon, classes } = VARIANT_STYLES[variant];
  const isSmall = size === 'sm';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        isSmall ? 'gap-1 px-2 py-0.5 text-xs' : 'gap-1.5 px-2.5 py-1 text-sm',
        hideLabel && (isSmall ? 'px-0.5 py-0.5' : 'px-1 py-1'),
        classes,
        className
      )}
    >
      <Icon aria-hidden="true" className={isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {hideLabel ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </span>
  );
}
