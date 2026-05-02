'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/common/SearchInput';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/constants/orderStatuses';
import { formatApiDate } from '@/lib/utils/formatDate';
import type { OrderStatus, DateRange } from '@/types';

const STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'artwork_pending', 'artwork_approved',
  'printing', 'ready_to_dispatch', 'dispatched', 'out_for_delivery',
  'delivered', 'cancelled', 'refunded',
];

interface OrderFiltersProps {
  search?: string;
  status?: OrderStatus;
  turnaround?: string;
  onSearch: (v: string) => void;
  onStatus: (v: OrderStatus | undefined) => void;
  onTurnaround: (v: 'standard' | 'express' | 'rush' | undefined) => void;
  onDateRange: (from?: string, to?: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function OrderFilters({
  search,
  status,
  turnaround,
  onSearch,
  onStatus,
  onTurnaround,
  onDateRange,
  onClear,
  hasActiveFilters,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        placeholder="Search orders, customers…"
        value={search}
        onChange={onSearch}
        className="w-56"
      />

      <Select
        value={status ?? ''}
        onValueChange={(v) => onStatus(v ? (v as OrderStatus) : undefined)}

      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={turnaround ?? ''}
        onValueChange={(v) =>
          onTurnaround(v ? (v as 'standard' | 'express' | 'rush') : undefined)
        }
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All types</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="express">Express</SelectItem>
          <SelectItem value="rush">Rush</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker
        onChange={(range: DateRange | undefined) =>
          onDateRange(
            range ? formatApiDate(range.from) : undefined,
            range ? formatApiDate(range.to) : undefined
          )
        }
        placeholder="Date range"
        className="h-7 text-xs"
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1 text-[var(--text-muted)]">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
