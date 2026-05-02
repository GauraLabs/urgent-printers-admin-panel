'use client';

import { DateRangePicker } from '@/components/common/DateRangePicker';
import { ExportButton } from '@/components/common/ExportButton';
import { cn } from '@/lib/utils/cn';
import { PERIOD_LABELS, type Period } from '../hooks/useReports';
import type { DateRange } from '@/types';

interface ReportControlsProps {
  period: Period;
  onPeriod: (p: Period) => void;
  custom?: DateRange;
  onCustom: (r: DateRange | undefined) => void;
  exportFilename: string;
  getExportData: () => Record<string, unknown>[];
}

const PERIODS = Object.entries(PERIOD_LABELS) as [Period, string][];

export function ReportControls({ period, onPeriod, custom, onCustom, exportFilename, getExportData }: ReportControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period quick-select */}
      <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1">
        {PERIODS.map(([p, label]) => (
          <button
            key={p}
            onClick={() => { onPeriod(p); onCustom(undefined); }}
            className={cn(
              'px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150',
              !custom && period === p
                ? 'bg-background text-foreground shadow-sm dark:bg-card'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <DateRangePicker
        value={custom}
        onChange={(r) => r && onCustom(r)}
        placeholder="Custom range"
        className="h-9 text-[13px]"
      />

      <div className="ml-auto">
        <ExportButton filename={exportFilename} getData={getExportData} label="Export CSV" />
      </div>
    </div>
  );
}
