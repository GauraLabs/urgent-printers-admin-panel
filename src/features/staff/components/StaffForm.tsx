'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PermissionEditor } from './PermissionEditor';
import { useCreateStaff, useUpdateStaff } from '../hooks/useStaff';
import { ROLE_LABELS, ALL_ROLES } from '@/lib/constants/roles';
import type { AdminUser, Permission, ApiError } from '@/types';

const baseSchema = {
  name: z.string().min(1, 'Name is required'),
  email: z.email('Enter a valid email'),
  role: z.enum(['super_admin', 'operations_manager', 'customer_support', 'catalogue_manager', 'finance', 'marketing']),
  is_active: z.boolean(),
  phone_number: z.string().optional(),
};

const createSchema = z.object({ ...baseSchema, password: z.string().min(8, 'Min 8 characters') });
const editSchema = z.object({
  ...baseSchema,
  // On edit, password is optional but must be ≥ 8 chars if provided
  password: z.string().refine((v) => v === '' || v.length >= 8, { message: 'Min 8 characters' }).optional(),
});

type CreateValues = z.infer<typeof createSchema>;

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

  const [showPermissions, setShowPermissions] = useState(false);
  const [grantedPermissions, setGrantedPermissions] = useState<Permission[]>(member?.granted_permissions ?? []);
  const [revokedPermissions, setRevokedPermissions] = useState<Permission[]>(member?.revoked_permissions ?? []);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: member
      ? { name: member.name, email: member.email, role: member.role, is_active: member.is_active, password: '', phone_number: member.phone_number ?? '' }
      : { name: '', email: '', role: 'customer_support', is_active: true, password: '', phone_number: '' },
  });

  const role = watch('role') as CreateValues['role'];
  const hasOverrides = grantedPermissions.length > 0 || revokedPermissions.length > 0;

  // When role changes, reset overrides (role change is a clean slate)
  function handleRoleChange(newRole: string | null) {
    setValue('role', (newRole ?? 'customer_support') as CreateValues['role'], { shouldValidate: true });
    setGrantedPermissions([]);
    setRevokedPermissions([]);
  }

  async function onSubmit(values: CreateValues) {
    try {
      if (isEdit && member) {
        await updateMutation.mutateAsync({
          id: member.id,
          data: {
            name: values.name,
            role: values.role,
            is_active: values.is_active,
            phone_number: values.phone_number || undefined,
            granted_permissions: grantedPermissions,
            revoked_permissions: revokedPermissions,
            // Only send password if a new one was typed
            ...(values.password ? { password: values.password } : {}),
          },
        });
        toast.success('Staff member updated');
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          email: values.email,
          role: values.role,
          password: values.password!,
          phone_number: values.phone_number || undefined,
          granted_permissions: grantedPermissions,
          revoked_permissions: revokedPermissions,
        });
        toast.success('Staff member created');
      }
      onSuccess();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message ?? 'Failed to save staff member');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Full Name *</label>
          <input {...register('name')} className={cls.input} placeholder="Raj Kumar" />
          {errors.name && <p className={cls.err}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={cls.label}>Email *</label>
          <input
            {...register('email')}
            type="email"
            disabled={isEdit}
            className={`${cls.input} ${isEdit ? 'opacity-60' : ''}`}
            placeholder="raj@urgentprinters.com"
          />
          {errors.email && <p className={cls.err}>{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Role *</label>
          <Select value={role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
          {role !== 'super_admin' && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Role sets the base permissions. Customise below if needed.
            </p>
          )}
        </div>
        <div>
          <label className={cls.label}>
            {isEdit ? 'New Password' : 'Password *'}
          </label>
          <input
            {...register('password')}
            type="password"
            className={cls.input}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
          />
          {errors.password && <p className={cls.err}>{errors.password.message}</p>}
        </div>
      </div>

      <div>
        <label className={cls.label}>Phone Number</label>
        <input
          {...register('phone_number')}
          type="tel"
          className={cls.input}
          placeholder="+91 98765 43210"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Required to enable SMS or WhatsApp notification channels for this staff member.
        </p>
        {errors.phone_number && <p className={cls.err}>{errors.phone_number.message}</p>}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <Switch
          checked={watch('is_active')}
          onCheckedChange={(v) => setValue('is_active', v, { shouldDirty: true })}
          size="sm"
        />
        <span className="text-sm text-foreground">Account active</span>
      </label>

      {/* Permission customisation — only for non-super-admin */}
      {role !== 'super_admin' && (
        <div>
          <button
            type="button"
            onClick={() => setShowPermissions((v) => !v)}
            className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-muted/40 transition-colors"
          >
            {showPermissions
              ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <Settings2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-[13px] font-semibold text-foreground flex-1">
              Customise Permissions
            </span>
            {hasOverrides ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                {grantedPermissions.length > 0 && `+${grantedPermissions.length} `}
                {revokedPermissions.length > 0 && `−${revokedPermissions.length}`}
                {' '}override{(grantedPermissions.length + revokedPermissions.length) !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground flex-shrink-0">Using role defaults</span>
            )}
          </button>

          {showPermissions && (
            <div className="mt-2">
              <PermissionEditor
                role={role}
                grantedPermissions={grantedPermissions}
                revokedPermissions={revokedPermissions}
                onChange={(granted, revoked) => {
                  setGrantedPermissions(granted);
                  setRevokedPermissions(revoked);
                }}
              />
            </div>
          )}
        </div>
      )}

      {role === 'super_admin' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[13px] text-amber-700 dark:text-amber-400">
          <span>Super Admin has all permissions. Individual customisation is not available.</span>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Member'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
