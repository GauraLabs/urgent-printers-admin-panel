'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateStaff, useUpdateStaff } from '../hooks/useStaff';
import { ROLE_LABELS, ALL_ROLES } from '@/lib/constants/roles';
import type { AdminUser } from '@/types';

const baseSchema = {
  name: z.string().min(1, 'Name is required'),
  email: z.email('Enter a valid email'),
  role: z.enum(['super_admin', 'operations_manager', 'customer_support', 'catalogue_manager', 'finance', 'marketing']),
  is_active: z.boolean(),
};

const createSchema = z.object({ ...baseSchema, password: z.string().min(8, 'Min 8 characters') });
const editSchema = z.object({ ...baseSchema, password: z.string().optional() });

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40',
  label: 'block text-xs font-semibold text-foreground mb-1.5',
  err: 'mt-1 text-xs text-destructive',
};

interface StaffFormProps {
  member?: AdminUser;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaffForm({ member, onSuccess, onCancel }: StaffFormProps) {
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const isEdit = !!member;

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: member
      ? { name: member.name, email: member.email, role: member.role, is_active: member.is_active, password: '' }
      : { name: '', email: '', role: 'customer_support', is_active: true, password: '' },
  });

  const role = watch('role');

  async function onSubmit(values: CreateValues) {
    try {
      if (isEdit && member) {
        await updateMutation.mutateAsync({ id: member.id, data: { name: values.name, role: values.role, is_active: values.is_active } });
        toast.success('Staff member updated');
      } else {
        await createMutation.mutateAsync({ name: values.name, email: values.email, role: values.role, password: values.password! });
        toast.success('Staff member created');
      }
      onSuccess();
    } catch { toast.error('Failed to save staff member'); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Full Name *</label>
          <input {...register('name')} className={cls.input} placeholder="Raj Kumar" />
          {errors.name && <p className={cls.err}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={cls.label}>Email *</label>
          <input {...register('email')} type="email" disabled={isEdit} className={`${cls.input} ${isEdit ? 'opacity-60' : ''}`} placeholder="raj@urgentprinters.com" />
          {errors.email && <p className={cls.err}>{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Role *</label>
          <Select value={role} onValueChange={(v) => setValue('role', (v ?? 'customer_support') as CreateValues['role'], { shouldValidate: true })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {!isEdit && (
          <div>
            <label className={cls.label}>Password *</label>
            <input {...register('password')} type="password" className={cls.input} placeholder="Min 8 characters" />
            {errors.password && <p className={cls.err}>{errors.password.message}</p>}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-foreground">Account active</span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Member'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
