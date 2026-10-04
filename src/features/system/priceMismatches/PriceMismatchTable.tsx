'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';
import { formatIst } from '@/lib/utils/istDate';
import {
  DEFAULT_PRICE_MISMATCH_FILTERS,
  MISMATCH_CAUSES,
  PRICE_MISMATCH_PAGE_SIZE,
  type PriceMismatch,
  type PriceMismatchFilters,
} from '@/lib/api/priceMismatches';
import { usePriceMismatches } from '../hooks/usePriceMismatches';
import { CauseBadge } from './CauseBadge';
import { CAUSE_META, STAGE_LABEL } from './causes';
import { diffClass, diffLabel, formatMoney, formatSignedMoney } from './format';
import { PriceMismatchDrawer } from './PriceMismatchDrawer';

export function PriceMismatchTable() {
  const [filters, setFilters] = useState<PriceMismatchFilters>(DEFAULT_PRICE_MISMATCH_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isError, isFetching } = usePriceMismatches(filters);

  const update = (patch: Partial<PriceMismatchFilters>) => setFilters((f) => ({ ...f, ...patch, offset: 0 }));
  const selected: PriceMismatch | null = data?.items.find((i) => i.id === selectedId) ?? null;

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : filters.offset + 1;
  const to = Math.min(filters.offset + PRICE_MISMATCH_PAGE_SIZE, total);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Cause</span>
          <Select value={filters.cause} onValueChange={(v) => update({ cause: (v ?? 'all') as PriceMismatchFilters['cause'] })}>
            <SelectTrigger size="sm" className="w-44" aria-label="Cause filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All causes</SelectItem>
              {MISMATCH_CAUSES.map((c) => <SelectItem key={c} value={c}>{CAUSE_META[c].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Stage</span>
          <Select value={filters.stage} onValueChange={(v) => update({ stage: (v ?? 'all') as PriceMismatchFilters['stage'] })}>
            <SelectTrigger size="sm" className="w-36" aria-label="Stage filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              <SelectItem value="preview">Preview</SelectItem>
              <SelectItem value="order_create">Order create</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Status</span>
          <Select value={filters.resolved} onValueChange={(v) => update({ resolved: (v ?? 'all') as PriceMismatchFilters['resolved'] })}>
            <SelectTrigger size="sm" className="w-36" aria-label="Status filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="pm-from" className="text-[11px] text-muted-foreground">From (IST)</label>
          <Input id="pm-from" type="date" className="h-8 w-40" value={filters.fromDate} onChange={(e) => update({ fromDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label htmlFor="pm-to" className="text-[11px] text-muted-foreground">To (IST)</label>
          <Input id="pm-to" type="date" className="h-8 w-40" value={filters.toDate} onChange={(e) => update({ toDate: e.target.value })} />
        </div>
      </div>

      <div className={cn('rounded-lg border bg-card overflow-x-auto', isFetching && 'opacity-80')}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time (IST)</TableHead>
              <TableHead>Cause</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit (client / server)</TableHead>
              <TableHead className="text-right">Total (client / server)</TableHead>
              <TableHead className="text-right">Diff</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-6" /></TableCell></TableRow>
            ))}
            {isError && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Could not load price mismatches.</TableCell></TableRow>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No mismatches match these filters.</TableCell></TableRow>
            )}
            {data?.items.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedId(item.id)}>
                <TableCell className="whitespace-nowrap text-[12px]">{formatIst(item.created_at)}</TableCell>
                <TableCell><CauseBadge cause={item.likely_cause} /></TableCell>
                <TableCell className="text-[12px]">{STAGE_LABEL[item.stage]}</TableCell>
                <TableCell className="text-[12px]">
                  {item.product_id && item.product_slug ? (
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.product_slug}
                    </Link>
                  ) : (
                    item.product_slug ?? (item.stage === 'order_create' && item.product_id === null ? 'Multiple items' : '—')
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.quantity ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">{formatMoney(item.client_unit)} / {formatMoney(item.server_unit)}</TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">{formatMoney(item.client_total)} / {formatMoney(item.server_total)}</TableCell>
                <TableCell className={cn('text-right tabular-nums font-medium whitespace-nowrap', diffClass(item.diff_total))}>
                  {formatSignedMoney(item.diff_total)}
                  {diffLabel(item.diff_total) && <span className="block text-[11px] font-normal">{diffLabel(item.diff_total)}</span>}
                </TableCell>
                <TableCell className="text-[12px] whitespace-nowrap">
                  {item.resolved_at ? <span className="text-emerald-600 dark:text-emerald-400">Resolved</span> : <span className="text-muted-foreground">Open</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
        <span>{from}–{to} of {total}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={filters.offset === 0} onClick={() => setFilters((f) => ({ ...f, offset: Math.max(0, f.offset - PRICE_MISMATCH_PAGE_SIZE) }))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={filters.offset + PRICE_MISMATCH_PAGE_SIZE >= total} onClick={() => setFilters((f) => ({ ...f, offset: f.offset + PRICE_MISMATCH_PAGE_SIZE }))}>Next</Button>
        </div>
      </div>

      <PriceMismatchDrawer item={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
