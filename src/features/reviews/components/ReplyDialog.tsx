'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReplyToReview } from '../hooks/useReviews';
import type { Review } from '@/types';

const schema = z.object({ reply: z.string().min(1, 'Reply cannot be empty') });
type FormValues = z.infer<typeof schema>;

interface ReplyDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review: Review;
}

export function ReplyDialog({ open, onOpenChange, review }: ReplyDialogProps) {
  const mutation = useReplyToReview();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reply: review.admin_reply ?? '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({ id: review.id, reply: values.reply });
      toast.success('Reply posted');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Failed to post reply');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>Reply to Review</DialogTitle>
          </div>
          <DialogDescription>
            Replying to {review.customer_name}&apos;s review of &ldquo;{review.product_name}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {/* Original review */}
        <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground italic">
          <div className="flex gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < review.rating ? 'text-amber-400' : 'text-border'}>★</span>
            ))}
          </div>
          &ldquo;{review.body}&rdquo;
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <textarea
              {...register('reply')}
              rows={4}
              placeholder="Write your official response…"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none"
            />
            {errors.reply && <p className="mt-1 text-xs text-destructive">{errors.reply.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Posting…' : 'Post Reply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
