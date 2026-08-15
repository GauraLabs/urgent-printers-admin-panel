import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { QUALITY_TIER_STYLES, type ImageDimensions, type ImageQualityTier } from '@/lib/utils/imageQuality';

interface ImageQualityBadgeProps {
  dims: ImageDimensions | null;
  tier: ImageQualityTier | null;
  loading?: boolean;
  className?: string;
  /** Dimensions only, no tier wording — for tight spaces like a 96px thumbnail grid. */
  compact?: boolean;
}

const TIER_SUFFIX: Record<ImageQualityTier, string> = {
  good: ' · good quality',
  ok: ' · usable, not ideal',
  poor: ' · below recommended size, may look blurry',
};

/** Advisory-only dimensions + quality tier readout. Never blocks anything by itself. */
export function ImageQualityBadge({ dims, tier, loading, className, compact }: ImageQualityBadgeProps) {
  if (loading) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[11px] text-muted-foreground', className)}>
        <Loader2 className="h-3 w-3 animate-spin" /> {compact ? 'Checking…' : 'Checking image size…'}
      </span>
    );
  }
  if (!dims || !tier) return null;

  const style = QUALITY_TIER_STYLES[tier];
  return (
    <span
      title={`${dims.width}×${dims.height}px${TIER_SUFFIX[tier]}`}
      className={cn('inline-flex items-center gap-1 text-[11px] font-medium', style.text, className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', style.dot)} />
      {dims.width}×{dims.height}px
      {!compact && TIER_SUFFIX[tier]}
    </span>
  );
}
