'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Send, Users, Mail, MessageSquare, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSendNotification } from '../hooks/useCommunications';

const schema = z.object({
  type: z.enum(['email', 'sms', 'push']),
  recipients: z.enum(['all', 'segment']),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});
type FormValues = z.infer<typeof schema>;

const TYPE_ICONS = { email: Mail, sms: MessageSquare, push: Bell };

export function SendNotificationForm() {
  const mutation = useSendNotification();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'email', recipients: 'all', message: '' },
  });

  const type = watch('type');
  const recipients = watch('recipients');
  const TypeIcon = TYPE_ICONS[type];

  async function onSubmit(values: FormValues) {
    try {
      const result = await mutation.mutateAsync({ ...values });
      toast.success(`Sent to ${result.sent_count.toLocaleString()} recipient${result.sent_count !== 1 ? 's' : ''}`);
      reset();
    } catch { toast.error('Failed to send notification'); }
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      {/* Type */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-2">Channel</label>
        <div className="flex gap-2">
          {(['email', 'sms', 'push'] as const).map((t) => {
            const Icon = TYPE_ICONS[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                  type === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipients */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-2">Recipients</label>
        <div className="grid grid-cols-2 gap-2">
          {(['all', 'segment'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setValue('recipients', r)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-[13px] font-medium transition-colors ${
                recipients === r
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Users className="h-4 w-4" />
              {r === 'all' ? 'All Customers' : 'Active Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Subject (email only) */}
      {type === 'email' && (
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Subject</label>
          <input {...register('subject')} className={inputCls} placeholder="Email subject line" />
        </div>
      )}

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">Message</label>
        <textarea
          {...register('message')}
          rows={4}
          className={`${inputCls} resize-none`}
          placeholder={type === 'push' ? 'Short push notification text…' : 'Your message…'}
        />
        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? 'Sending…'
          : <><Send className="h-4 w-4" /> Send Notification</>}
      </Button>
    </form>
  );
}
