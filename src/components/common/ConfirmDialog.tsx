'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'default';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant !== 'default' && (
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  variant === 'danger' && 'bg-[var(--danger-bg)]',
                  variant === 'warning' && 'bg-[var(--warning-bg)]'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'h-5 w-5',
                    variant === 'danger' && 'text-[var(--danger)]',
                    variant === 'warning' && 'text-[var(--warning)]'
                  )}
                />
              </div>
            )}
            <DialogTitle className="text-base">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm text-[var(--text-secondary)] pl-13">
          {description}
        </DialogDescription>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              variant === 'danger' && 'bg-[var(--danger)] hover:bg-red-600 text-white',
              variant === 'warning' && 'bg-[var(--warning)] hover:bg-orange-600 text-white'
            )}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
