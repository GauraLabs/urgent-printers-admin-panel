'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCsv } from '@/lib/utils/exportCsv';

interface ExportButtonProps {
  filename: string;
  getData: () => Record<string, unknown>[];
  label?: string;
  disabled?: boolean;
}

export function ExportButton({ filename, getData, label = 'Export CSV', disabled }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => {
        const data = getData();
        exportToCsv(filename, data);
      }}
    >
      <Download className="h-4 w-4 mr-1.5" />
      {label}
    </Button>
  );
}
