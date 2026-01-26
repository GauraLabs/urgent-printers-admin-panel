/**
 * Order Detail Page
 * View and manage single order
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck, FileText } from 'lucide-react';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useGetOrderQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  // Mock order data
  const mockOrder = {
    id: '1',
    order_number: 'ORD-2024-1234',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'razorpay',
    created_at: '2024-01-25T10:30:00',
    customer: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98765 43210',
    },
    shipping_address: {
      name: 'Rahul Sharma',
      line1: '123 MG Road',
      line2: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
    items: [
      { id: '1', product_name: 'Business Cards - Premium', variant_name: 'Matte Finish', quantity: 500, unit_price: 2, total: 1000 },
      { id: '2', product_name: 'Letterhead - Standard', variant_name: '100 GSM', quantity: 200, unit_price: 5, total: 1000 },
    ],
    subtotal: 2000,
    cgst: 180,
    sgst: 180,
    total_amount: 2360,
    notes: 'Please deliver before 5 PM',
  };

  const displayOrder = order || mockOrder;

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatus({
        id,
        status: newStatus,
        reason: `Status changed to ${newStatus}`,
      }).unwrap();
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${displayOrder.order_number}`}
        description={`Created on ${new Date(displayOrder.created_at).toLocaleString()}`}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Orders', href: ROUTES.ORDERS },
          { label: displayOrder.order_number },
        ]}
      >
        <button
          onClick={() => navigate(ROUTES.ORDERS)}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Order Items</h3>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrder.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">₹{item.unit_price}</td>
                      <td className="py-3 text-right font-medium">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{displayOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST (9%)</span>
                  <span>₹{displayOrder.cgst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST (9%)</span>
                  <span>₹{displayOrder.sgst}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{displayOrder.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {displayOrder.notes && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Customer Notes</h3>
              </div>
              <p className="text-muted-foreground">{displayOrder.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-4 font-semibold">Order Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={displayOrder.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment</span>
                <StatusBadge status={displayOrder.payment_status} />
              </div>
            </div>

            {/* Status Actions */}
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {displayOrder.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={isUpdating}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                >
                  Start Processing
                </button>
              )}
              {displayOrder.status === 'processing' && (
                <button
                  onClick={() => handleStatusUpdate('dispatched')}
                  disabled={isUpdating}
                  className="w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
                >
                  Mark as Dispatched
                </button>
              )}
              {displayOrder.status === 'dispatched' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={isUpdating}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Customer</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{displayOrder.customer.name}</p>
              <p className="text-muted-foreground">{displayOrder.customer.email}</p>
              <p className="text-muted-foreground">{displayOrder.customer.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{displayOrder.shipping_address.name}</p>
              <p>{displayOrder.shipping_address.line1}</p>
              {displayOrder.shipping_address.line2 && <p>{displayOrder.shipping_address.line2}</p>}
              <p>
                {displayOrder.shipping_address.city}, {displayOrder.shipping_address.state} {displayOrder.shipping_address.pincode}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Payment</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{displayOrder.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={displayOrder.payment_status} size="xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
