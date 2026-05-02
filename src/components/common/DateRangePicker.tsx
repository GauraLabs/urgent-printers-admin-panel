'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils/cn';
import type { DateRange } from '@/types';

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const label = value
    ? `${format(value.from, 'dd MMM yyyy')} – ${format(value.to, 'dd MMM yyyy')}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-2 px-2.5 py-1 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-colors justify-start text-left font-normal',
          !value && 'text-[var(--text-muted)]',
          className
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value ? { from: value.from, to: value.to } : undefined}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange({ from: range.from, to: range.to });
              setOpen(false);
            }
          }}
          numberOfMonths={2}
          initialFocus
        />
        {value && (
          <div className="p-2 border-t border-[var(--border)]">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[var(--text-muted)]"
              onClick={() => { onChange(undefined); setOpen(false); }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
