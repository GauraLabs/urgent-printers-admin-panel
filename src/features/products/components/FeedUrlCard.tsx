'use client';

import { useState } from 'react';
import { Copy, Check, Rss } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '');

export const FEED_URL = `${API_BASE}/feeds/products.xml`;

export function FeedUrlCard() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(FEED_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the URL and copy it manually.');
    }
  }

  return (
    <section aria-labelledby="feed-url-heading" className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2">
        <Rss className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
        <h2 id="feed-url-heading" className="text-sm font-semibold text-[var(--text-primary)]">Shopping feed</h2>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={FEED_URL}
          aria-label="Shopping feed URL"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1.5 text-xs tabular-nums text-[var(--text-primary)]"
        />
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        One feed for Google Merchant Center, Microsoft Merchant Center and the Meta catalog. In each, add it as a scheduled fetch (daily).
        Only active, categorised products with at least one image are listed.
      </p>
    </section>
  );
}
