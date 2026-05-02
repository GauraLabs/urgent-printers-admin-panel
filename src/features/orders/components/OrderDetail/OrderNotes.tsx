'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatDate';
import { useAddOrderNote } from '../../hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { OrderNote } from '@/types';

export function OrderNotes({ orderId, notes }: { orderId: string; notes: OrderNote[] }) {
  const [text, setText] = useState('');
  const mutation = useAddOrderNote();
  const user = useAuthStore((s) => s.user);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await mutation.mutateAsync({ id: orderId, content: text.trim() });
      setText('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Internal Notes</h3>

      {notes.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] mb-4">No notes yet. Add one below.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {notes.map((note) => (
            <li key={note.id} className="bg-[var(--surface-secondary)] rounded-lg px-3 py-2.5">
              <p className="text-xs text-[var(--text-primary)]">{note.content}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {note.admin_name} · {formatDateTime(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Add a note as ${user?.name ?? 'Admin'}…`}
          className="flex-1 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <button
          type="submit"
          disabled={!text.trim() || mutation.isPending}
          className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
