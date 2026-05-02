'use client';

import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { QueueTable } from '@/features/printing-queue/components/QueueTable';
import { usePrintingQueue, useQueueCounts } from '@/features/printing-queue/hooks/usePrintingQueue';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import type { QueueStatus } from '@/lib/api/printingQueue';

const TABS: { value: QueueStatus; label: string }[] = [
  { value: 'artwork_pending', label: 'Awaiting Artwork' },
  { value: 'artwork_approved', label: 'Ready to Print' },
  { value: 'printing', label: 'Printing' },
  { value: 'ready_to_dispatch', label: 'Ready to Dispatch' },
];

export default function PrintingQueuePage() {
  const [activeTab, setActiveTab] = useState<QueueStatus>('artwork_pending');
  const qc = useQueryClient();
  const { data: allItems, isLoading, dataUpdatedAt, isFetching } = usePrintingQueue();
  const counts = useQueueCounts();

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['printing-queue'] });
  }, [qc]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Printing Queue"
        description="Manage artwork approvals, production, and dispatch."
        actions={
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Updated {formatDateTime(new Date(dataUpdatedAt))}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </button>
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => { if (v) setActiveTab(v as QueueStatus); }}
      >
        <TabsList>
          {TABS.map((tab) => {
            const count = counts[tab.value];
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-foreground/10 text-foreground tabular-nums">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4 outline-none">
            <QueueTable
              items={allItems?.filter((i) => i.status === tab.value) ?? []}
              tabStatus={tab.value}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
