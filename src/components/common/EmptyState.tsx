'use client';

import { motion } from 'motion/react';
import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ message = 'No results found', action, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-12 text-center gap-3"
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        {icon ?? <FileSearch className="h-5 w-5" />}
      </div>
      <p className="text-[13px] text-muted-foreground max-w-xs">{message}</p>
      {action}
    </motion.div>
  );
}
