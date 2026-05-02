'use client';

import { cn } from '@/lib/utils/cn';

// Lightweight placeholder — Tiptap or other RTE can be wired up here.
// For now renders a styled textarea that stores raw HTML.
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content…',
  className,
  rows = 8,
}: RichTextEditorProps) {
  return (
    <div className={cn('rounded-md border border-[var(--border)] overflow-hidden', className)}>
      <div className="flex gap-1 px-2 py-1.5 bg-[var(--surface-secondary)] border-b border-[var(--border)]">
        {['B', 'I', 'U', 'H2', 'UL', 'OL', 'Link'].map((label) => (
          <button
            key={label}
            type="button"
            className="px-2 py-0.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--border)] rounded transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-y"
      />
    </div>
  );
}
