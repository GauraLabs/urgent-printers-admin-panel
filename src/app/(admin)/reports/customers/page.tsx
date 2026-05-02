'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { ReportControls } from '@/features/reports/components/ReportControls';
import { CustomersReport } from '@/features/reports/components/CustomersReport';
import { useReportDateRange, useCustomersReport } from '@/features/reports/hooks/useReports';

export default function CustomersReportPage() {
  const { period, setPeriod, custom, setCustom, from, to } = useReportDateRange();
  const { data } = useCustomersReport(from, to);

  return (
    <div className="space-y-5">
      <PageHeader title="Customers Report" description="New customers, retention, and lifetime value." />
      <ReportControls
        period={period} onPeriod={setPeriod}
        custom={custom} onCustom={setCustom}
        exportFilename="customers-report"
        getExportData={() =>
          data?.customers_by_state.map((r) => ({ state: r.state, customers: r.count, revenue: r.revenue })) ?? []
        }
      />
      <CustomersReport from={from} to={to} />
    </div>
  );
}
