'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Truck, Loader2, PackagePlus, Search, PackageX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { OrderItems } from '@/features/orders/components/OrderDetail/OrderItems';
import { ManualShipmentDialog } from '@/features/shipping/components/ManualShipmentDialog';
import { useOrderDetail } from '@/features/orders/hooks/useOrderDetail';
import { useCreateShipment } from '@/features/shipping/hooks/useShipping';
import { checkServiceability } from '@/lib/api/shipping';
import { usePermissions } from '@/hooks/usePermissions';
import { formatPrice } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';
import type { CourierOption } from '@/lib/api/shipping';
import type { ApiError } from '@/types';

const packageSchema = z.object({
  weight_kg: z.number().gt(0, 'Must be greater than 0'),
  length_cm: z.number().gt(0, 'Must be greater than 0'),
  breadth_cm: z.number().gt(0, 'Must be greater than 0'),
  height_cm: z.number().gt(0, 'Must be greater than 0'),
});

const addressSchema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  email: z.email('Enter a valid email'),
  address_line1: z.string().min(1, 'Required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  country: z.string().min(1, 'Required'),
});

type PackageValues = z.infer<typeof packageSchema>;
type AddressValues = z.infer<typeof addressSchema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
  err: 'mt-1 text-xs text-[var(--danger)]',
  card: 'bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4',
  cardTitle: 'text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3',
};

export function DispatchOrderClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const { canManageShipping } = usePermissions();
  const createShipment = useCreateShipment();

  const [couriers, setCouriers] = useState<CourierOption[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [manualOpen, setManualOpen] = useState(false);

  const packageForm = useForm<PackageValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: { weight_kg: 0.5, length_cm: 10, breadth_cm: 10, height_cm: 5 },
  });

  const addressForm = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    values: order
      ? {
          name: order.shipping_address.full_name,
          phone: order.shipping_address.phone ?? '',
          email: order.customer_email ?? '',
          address_line1: order.shipping_address.line1,
          address_line2: order.shipping_address.line2 ?? '',
          city: order.shipping_address.city,
          state: order.shipping_address.state,
          pincode: order.shipping_address.pincode,
          country: order.shipping_address.country,
        }
      : undefined,
    defaultValues: {
      name: '', phone: '', email: '', address_line1: '', address_line2: '',
      city: '', state: '', pincode: '', country: 'India',
    },
  });

  async function handleCheckCouriers() {
    const [pincodeValid, weightValid] = await Promise.all([
      addressForm.trigger('pincode'),
      packageForm.trigger('weight_kg'),
    ]);
    if (!pincodeValid || !weightValid) return;

    setChecking(true);
    setCheckError(null);
    setCouriers(null);
    setSelectedCourier('');
    try {
      const result = await checkServiceability(
        addressForm.getValues('pincode'),
        packageForm.getValues('weight_kg')
      );
      if (!result.is_serviceable || result.couriers.length === 0) {
        setCheckError('No couriers are serviceable for this pincode.');
        setCouriers([]);
      } else {
        setCouriers(result.couriers);
      }
    } catch {
      setCheckError('Failed to check serviceability. Please try again.');
      setCouriers([]);
    } finally {
      setChecking(false);
    }
  }

  async function handleCreateShipment() {
    if (!selectedCourier) {
      toast.error('Select a courier first.');
      return;
    }
    const [addressValid, packageValid] = await Promise.all([
      addressForm.trigger(),
      packageForm.trigger(),
    ]);
    if (!addressValid || !packageValid) {
      toast.error('Fix the highlighted fields before creating the shipment.');
      return;
    }

    const address = addressForm.getValues();
    const pkg = packageForm.getValues();

    try {
      await createShipment.mutateAsync({
        orderId,
        courier: selectedCourier,
        overrides: {
          weight_kg: pkg.weight_kg,
          length_cm: pkg.length_cm,
          breadth_cm: pkg.breadth_cm,
          height_cm: pkg.height_cm,
          address_override: {
            name: address.name,
            phone: address.phone,
            email: address.email,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || null,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
          },
        },
      });
      toast.success(`Shipment created for ${order?.order_number ?? orderId}`);
      router.push(ROUTES.PRINTING_QUEUE);
    } catch {
      toast.error('Failed to create shipment. Please try again.');
    }
  }

  function handleManualSuccess() {
    router.push(ROUTES.PRINTING_QUEUE);
  }

  if (isLoading) return <PageSkeleton />;

  const apiError = error as ApiError | null;

  if (apiError?.status === 404) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageX className="h-12 w-12 text-[var(--text-muted)] mb-4" />
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Order not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          No order with ID <span className="font-mono">{orderId}</span> exists.
        </p>
        <Link
          href={ROUTES.PRINTING_QUEUE}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to printing queue
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-[var(--danger)] mb-4">
          {apiError?.message ?? 'Failed to load order. Please try again.'}
        </p>
        <Link
          href={ROUTES.PRINTING_QUEUE}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to printing queue
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Dispatch ${order.order_number}`}
        description={`${order.customer_name} · ${formatPrice(order.total_amount)}`}
        actions={
          <Link
            href={ROUTES.PRINTING_QUEUE}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Printing Queue
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <OrderItems items={order.items} />

          <div className={cls.card}>
            <h3 className={cls.cardTitle}>Package Details</h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-3 -mt-2">
              Defaults to the platform placeholder (0.5kg, 10×10×5cm) — correct before checking couriers if the real package differs.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={cls.label}>Weight (kg)</label>
                <input type="number" step="0.01" min="0.01" {...packageForm.register('weight_kg', { valueAsNumber: true })} className={cls.input} />
                {packageForm.formState.errors.weight_kg && (
                  <p className={cls.err}>{packageForm.formState.errors.weight_kg.message}</p>
                )}
              </div>
              <div>
                <label className={cls.label}>Length (cm)</label>
                <input type="number" step="0.1" min="0.1" {...packageForm.register('length_cm', { valueAsNumber: true })} className={cls.input} />
                {packageForm.formState.errors.length_cm && (
                  <p className={cls.err}>{packageForm.formState.errors.length_cm.message}</p>
                )}
              </div>
              <div>
                <label className={cls.label}>Width (cm)</label>
                <input type="number" step="0.1" min="0.1" {...packageForm.register('breadth_cm', { valueAsNumber: true })} className={cls.input} />
                {packageForm.formState.errors.breadth_cm && (
                  <p className={cls.err}>{packageForm.formState.errors.breadth_cm.message}</p>
                )}
              </div>
              <div>
                <label className={cls.label}>Height (cm)</label>
                <input type="number" step="0.1" min="0.1" {...packageForm.register('height_cm', { valueAsNumber: true })} className={cls.input} />
                {packageForm.formState.errors.height_cm && (
                  <p className={cls.err}>{packageForm.formState.errors.height_cm.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className={cls.card}>
            <h3 className={cls.cardTitle}>Delivery Address</h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-3 -mt-2">
              Pre-filled from the order. Correct any typos (especially the pincode) before checking couriers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={cls.label}>Name</label>
                <input type="text" {...addressForm.register('name')} className={cls.input} />
                {addressForm.formState.errors.name && <p className={cls.err}>{addressForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className={cls.label}>Phone</label>
                <input type="text" {...addressForm.register('phone')} className={cls.input} />
                {addressForm.formState.errors.phone && <p className={cls.err}>{addressForm.formState.errors.phone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={cls.label}>Email</label>
                <input type="email" {...addressForm.register('email')} className={cls.input} />
                {addressForm.formState.errors.email && <p className={cls.err}>{addressForm.formState.errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={cls.label}>Address Line 1</label>
                <input type="text" {...addressForm.register('address_line1')} className={cls.input} />
                {addressForm.formState.errors.address_line1 && (
                  <p className={cls.err}>{addressForm.formState.errors.address_line1.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={cls.label}>
                  Address Line 2 <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input type="text" {...addressForm.register('address_line2')} className={cls.input} />
              </div>
              <div>
                <label className={cls.label}>City</label>
                <input type="text" {...addressForm.register('city')} className={cls.input} />
                {addressForm.formState.errors.city && <p className={cls.err}>{addressForm.formState.errors.city.message}</p>}
              </div>
              <div>
                <label className={cls.label}>State</label>
                <input type="text" {...addressForm.register('state')} className={cls.input} />
                {addressForm.formState.errors.state && <p className={cls.err}>{addressForm.formState.errors.state.message}</p>}
              </div>
              <div>
                <label className={cls.label}>Pincode</label>
                <input type="text" inputMode="numeric" maxLength={6} {...addressForm.register('pincode')} className={cls.input} />
                {addressForm.formState.errors.pincode && <p className={cls.err}>{addressForm.formState.errors.pincode.message}</p>}
              </div>
              <div>
                <label className={cls.label}>Country</label>
                <input type="text" {...addressForm.register('country')} className={cls.input} />
                {addressForm.formState.errors.country && <p className={cls.err}>{addressForm.formState.errors.country.message}</p>}
              </div>
            </div>
          </div>

          <div className={cls.card}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className={cn(cls.cardTitle, 'mb-0')}>Couriers</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleCheckCouriers} disabled={checking}>
                {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Check Couriers
              </Button>
            </div>

            {checking && (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking serviceability…
              </div>
            )}

            {!checking && checkError && (
              <p className="text-sm text-[var(--danger)] py-2">{checkError}</p>
            )}

            {!checking && couriers && couriers.length > 0 && (
              <div className="space-y-2">
                {couriers.map((c) => (
                  <label
                    key={c.courier_id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedCourier === c.courier_id
                        ? 'border-[var(--primary)] bg-[var(--info-bg)]'
                        : 'border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--text-muted)]'
                    )}
                  >
                    <input
                      type="radio"
                      name="courier"
                      value={c.courier_id}
                      checked={selectedCourier === c.courier_id}
                      onChange={() => setSelectedCourier(c.courier_id)}
                      className="h-4 w-4 flex-shrink-0 accent-[var(--primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {c.min_days}–{c.max_days} business days{c.cod_available ? ' · COD available' : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums flex-shrink-0">
                      {formatPrice(c.rate)}
                    </p>
                  </label>
                ))}
              </div>
            )}

            {!checking && couriers === null && !checkError && (
              <p className="text-sm text-[var(--text-muted)] py-2">
                Check couriers to see available options for the address and weight above.
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex justify-end">
              <Button
                type="button"
                onClick={handleCreateShipment}
                disabled={!canManageShipping || !selectedCourier || createShipment.isPending}
              >
                {createShipment.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><Truck className="h-4 w-4" /> Create Shipment</>
                )}
              </Button>
            </div>
            {!canManageShipping && (
              <p className="mt-2 text-[11px] text-[var(--text-muted)] text-right">
                You don&apos;t have permission to create shipments.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cls.card}>
            <h3 className={cls.cardTitle}>Order Summary</h3>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Order</dt>
                <dd className="font-mono font-semibold text-[var(--text-primary)]">{order.order_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Customer</dt>
                <dd className="text-[var(--text-primary)]">{order.customer_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Items</dt>
                <dd className="text-[var(--text-primary)]">{order.items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Total</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{formatPrice(order.total_amount)}</dd>
              </div>
            </dl>
          </div>

          <div className={cls.card}>
            <h3 className={cls.cardTitle}>Manual Dispatch</h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Use this if Shiprocket is down or doesn&apos;t serve this pincode — always available, regardless of the courier check above.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!canManageShipping}
              onClick={() => setManualOpen(true)}
            >
              <PackagePlus className="h-3.5 w-3.5" /> Enter Shipment Manually Instead
            </Button>
          </div>
        </div>
      </div>

      <ManualShipmentDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        orderId={order.id}
        orderNumber={order.order_number}
        onSuccess={handleManualSuccess}
      />
    </div>
  );
}
