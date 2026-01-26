/**
 * Stat Card Component
 * Display metric cards with icon, value, and trend
 */

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel = 'vs last period',
  className,
  valuePrefix = '',
  valueSuffix = '',
  loading = false,
}) => {
  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-4 w-4" />;
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="mt-4 h-8 w-32 rounded bg-muted" />
          <div className="mt-4 h-3 w-20 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {valuePrefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {valueSuffix}
          </p>
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      {(trend || trendValue) && (
        <div className={cn('mt-4 flex items-center gap-1', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {trendValue && `${trendValue > 0 ? '+' : ''}${trendValue}%`}
          </span>
          <span className="text-sm text-muted-foreground">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
