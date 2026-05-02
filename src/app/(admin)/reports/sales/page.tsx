'use client';

import { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReportControls } from '@/features/reports/components/ReportControls';
import { SalesReport } from '@/features/reports/components/SalesReport';
import { useReportDateRange } from '@/features/reports/hooks/useReports';
import { useSalesReport } from '@/features/reports/hooks/useReports';

export default function SalesReportPage() {
  const { period, setPeriod, custom, setCustom, from, to } = useReportDateRange();
  const { data } = useSalesReport(from, to);

  return (
    <div className="space-y-5">
      <PageHeader title="Sales Report" description="Revenue, orders, and product performance." />
      <ReportControls
        period={period} onPeriod={setPeriod}
        custom={custom} onCustom={setCustom}
        exportFilename="sales-report"
        getExportData={() =>
          data?.revenue_by_product.map((r) => ({ product: r.product, orders: r.orders, revenue: r.revenue })) ?? []
        }
      />
      <SalesReport from={from} to={to} />
    </div>
  );
}
