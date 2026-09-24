import { Eye, Flame, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VenueInterestBadgeProps {
  views?: number;
  promoLabel?: string | null;
  compact?: boolean;
  className?: string;
}

export function VenueInterestBadge({ views = 0, promoLabel, compact, className }: VenueInterestBadgeProps) {
  if (!promoLabel && views === 0) return null;

  const interestText = views >= 10 ? `Dilihat ${views} kali dalam 7 hari` : 'Mulai diminati';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {promoLabel && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
          <Tag className="h-3 w-3" />
          {promoLabel}
        </span>
      )}
      {views > 0 && (
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 text-foreground backdrop-blur',
          compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
        )}>
          {views >= 10 ? <Eye className="h-3 w-3 text-primary" /> : <Flame className="h-3 w-3 text-primary" />}
          {interestText}
        </span>
      )}
    </div>
  );
}