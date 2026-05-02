'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { ReportControls } from '@/features/reports/components/ReportControls';
import { OperationsReport } from '@/features/reports/components/OperationsReport';
import { useReportDateRange, useOperationsReport } from '@/features/reports/hooks/useReports';

export default function OperationsReportPage() {
  const { period, setPeriod, custom, setCustom, from, to } = useReportDateRange();
  const { data } = useOperationsReport(from, to);

  return (
    <div className="space-y-5">
      <PageHeader title="Operations Report" description="Production times, turnaround distribution, and artwork quality." />
      <ReportControls
        period={period} onPeriod={setPeriod}
        custom={custom} onCustom={setCustom}
        exportFilename="operations-report"
        getExportData={() =>
          data?.turnaround_distribution.map((r) => ({ type: r.type, count: r.count, pct: r.pct })) ?? []
        }
      />
      <OperationsReport from={from} to={to} />
    </div>
  );
}
