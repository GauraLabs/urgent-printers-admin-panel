import { cn } from '@/lib/utils/cn';
import type { MismatchCause } from '@/lib/api/priceMismatches';
import { CAUSE_META } from './causes';

export function CauseBadge({ cause, className }: { cause: MismatchCause; className?: string }) {
  const meta = CAUSE_META[cause];
  return (
    <span
      data-cause={cause}
      className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap', meta.badgeCls, className)}
    >
      {meta.label}
    </span>
  );
}
