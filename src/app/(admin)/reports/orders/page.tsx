'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { ReportControls } from '@/features/reports/components/ReportControls';
import { OrdersReport } from '@/features/reports/components/OrdersReport';
import { useReportDateRange, useOrdersReport } from '@/features/reports/hooks/useReports';

export default function OrdersReportPage() {
  const { period, setPeriod, custom, setCustom, from, to } = useReportDateRange();
  const { data } = useOrdersReport(from, to);

  return (
    <div className="space-y-5">
      <PageHeader title="Orders Report" description="Order volume, cancellations, and fulfillment metrics." />
      <ReportControls
        period={period} onPeriod={setPeriod}
        custom={custom} onCustom={setCustom}
        exportFilename="orders-report"
        getExportData={() =>
          data?.orders_by_status.map((r) => ({ status: r.status, count: r.count })) ?? []
        }
      />
      <OrdersReport from={from} to={to} />
    </div>
  );
}
