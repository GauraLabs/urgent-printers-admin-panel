import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" style={{ animationDelay: `${i * 0.04}s` }} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-5 space-y-3', className)}>
      <Skeleton className="h-3.5 w-20 rounded" />
      <Skeleton className="h-7 w-28 rounded" />
      <Skeleton className="h-3 w-36 rounded" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <LoadingSkeleton rows={7} />
    </div>
  );
}
