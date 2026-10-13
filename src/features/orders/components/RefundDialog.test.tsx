import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefundDialog } from './RefundDialog';

const mutateAsync = vi.fn();
const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('../hooks/useOrders', () => ({ useCreateRefund: () => ({ mutateAsync, isPending: false }) }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select aria-label="Reason" value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="">Select</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));

function setup(onResolveRequested?: () => void) {
  const onOpenChange = vi.fn();
  render(<RefundDialog open onOpenChange={onOpenChange} orderId="42" orderNumber="UP-42" maxAmount={1500} onResolveRequested={onResolveRequested} />);
  return { onOpenChange };
}

async function submit() {
  fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'quality_issue' } });
  fireEvent.click(screen.getByRole('button', { name: 'Issue Refund' }));
}

beforeEach(() => { mutateAsync.mockReset(); toast.success.mockReset(); });

describe('RefundDialog', () => {
  it('sends a full refund without an amount and shows the refund id', async () => {
    mutateAsync.mockResolvedValue({ refund_id: 'rfnd_123', refund_amount: 1500 });
    const { onOpenChange } = setup();
    await submit();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ order_id: '42', amount: undefined, reason: 'quality_issue', notes: undefined });
    expect(toast.success.mock.calls[0][1]).toEqual({ description: 'Refund ID: rfnd_123' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('sends a partial amount', async () => {
    mutateAsync.mockResolvedValue({ refund_id: 'rfnd_9', refund_amount: 400 });
    setup();
    fireEvent.change(screen.getByLabelText('Amount (₹)'), { target: { value: '400' } });
    await submit();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0]).toMatchObject({ amount: 400 });
  });

  it('blocks amounts above the paid total', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Amount (₹)'), { target: { value: '2000' } });
    await submit();
    expect(await screen.findByText(/can't exceed/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['refund_already_issued', 409, 'This order was already refunded.'],
    ['refund_not_paid', 409, "Order isn't paid."],
    ['refund_rejected', 409, 'Razorpay rejected the refund; you can retry.'],
  ])('shows %s inline and keeps the dialog open', async (code, status, text) => {
    mutateAsync.mockRejectedValue({ code, status, message: 'raw' });
    const { onOpenChange } = setup();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(text);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('shows the invalid amount message from the server', async () => {
    mutateAsync.mockRejectedValue({ code: 'refund_amount_invalid', status: 422, message: 'Refund amount must be between 0.01 and 1500.00' });
    setup();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('between 0.01 and 1500.00');
  });

  it('on 503 refund_unconfirmed, locks submit and offers resolve for super admins', async () => {
    mutateAsync.mockRejectedValue({ code: 'refund_unconfirmed', status: 503, message: 'raw' });
    const onResolve = vi.fn();
    setup(onResolve);
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('check the Razorpay dashboard before retrying');
    expect(screen.getByRole('button', { name: 'Issue Refund' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Resolve refund' }));
    expect(onResolve).toHaveBeenCalled();
  });

  it('hides the resolve action when not permitted', async () => {
    mutateAsync.mockRejectedValue({ code: 'refund_unconfirmed', status: 503, message: 'raw' });
    setup();
    await submit();
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Resolve refund' })).toBeNull();
  });
});
