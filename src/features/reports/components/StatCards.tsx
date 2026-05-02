import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

export interface StatCardData {
  label: string;
  value: string;
  change?: number; // percentage change
  sub?: string;
}

function StatCard({ label, value, change, sub }: StatCardData) {
  const hasChange = change !== undefined;
  const positive = hasChange && change >= 0;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {hasChange && (
          <span className={cn('inline-flex items-center gap-0.5 text-[12px] font-semibold', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-[12px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="h-7 w-32 rounded" />
      <Skeleton className="h-3 w-20 rounded" />
    </div>
  );
}

interface StatCardsProps {
  cards: StatCardData[];
  isLoading?: boolean;
  cols?: 2 | 3 | 4 | 5;
}

const COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
};

export function StatCards({ cards, isLoading, cols = 4 }: StatCardsProps) {
  return (
    <div className={cn('grid gap-4', COLS[cols] ?? COLS[4])}>
      {isLoading
        ? Array.from({ length: cols }).map((_, i) => <StatCardSkeleton key={i} />)
        : cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
