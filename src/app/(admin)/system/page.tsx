'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceHealthCards } from '@/features/system/components/ServiceHealthCards';
import { JobQueueMonitor } from '@/features/system/components/JobQueueMonitor';
import { ErrorLog } from '@/features/system/components/ErrorLog';
import { useSystemHealth, useJobQueue, useErrorLog } from '@/features/system/hooks/useSystemHealth';

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      {description && <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

export default function SystemHealthPage() {
  const qc = useQueryClient();
  const { isFetching: healthFetching } = useSystemHealth();
  const { } = useJobQueue();
  const { } = useErrorLog();

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['system-health'] });
    qc.invalidateQueries({ queryKey: ['job-queue'] });
    qc.invalidateQueries({ queryKey: ['error-log'] });
  }, [qc]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="System Health"
        description="Live status of all external services, background jobs, and error log."
      />

      {/* Services */}
      <section>
        <SectionHeader
          title="Service Status"
          description="External services polled every 30 seconds."
        />
        <ServiceHealthCards onRefresh={refresh} isFetching={healthFetching} />
      </section>

      {/* Job Queue */}
      <section>
        <SectionHeader
          title="Background Jobs"
          description="Celery queue — refreshes every 15 seconds."
        />
        <JobQueueMonitor />
      </section>

      {/* Error Log */}
      <section>
        <SectionHeader
          title="Error Log"
          description="Recent warnings, errors, and critical events from the backend."
        />
        <ErrorLog />
      </section>
    </div>
  );
}
