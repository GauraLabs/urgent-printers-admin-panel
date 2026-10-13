import { describe, expect, it } from 'vitest';
import {
  describeRefundError, describeStatusChangeError, isRefundUnconfirmed, isRateLimited,
} from './validationErrors';
import { loginErrorMessage } from './loginError';
import { passwordLengthError, setPasswordErrorMessage } from '@/lib/utils/passwordPolicy';

describe('describeRefundError', () => {
  it.each([
    [{ status: 409, code: 'refund_already_issued', message: 'm' }, 'This order was already refunded.'],
    [{ status: 409, code: 'refund_not_paid', message: 'm' }, "Order isn't paid."],
    [{ status: 409, code: 'refund_rejected', message: 'm' }, 'Razorpay rejected the refund; you can retry.'],
    [{ status: 503, code: 'refund_unconfirmed', message: 'm' }, 'Refund status unknown — check the Razorpay dashboard before retrying.'],
  ])('maps %o', (err, text) => {
    expect(describeRefundError(err)).toBe(text);
  });

  it.each([
    ['no_open_refund_claim', 409], ['refund_exists_at_provider', 409], ['no_refund_at_provider', 409], ['refund_not_found_at_provider', 422],
  ])('has dedicated copy for resolve error %s', (code, status) => {
    expect(describeRefundError({ status, code, message: 'raw' })).not.toBe('raw');
    expect(describeRefundError({ status, code, message: 'raw' })).not.toMatch(/^Failed to issue/);
  });

  it('shows the server message for an invalid amount', () => {
    expect(describeRefundError({ status: 422, code: 'refund_amount_invalid', message: 'Refund amount must be between 0.01 and 100.00' }))
      .toBe('Refund amount must be between 0.01 and 100.00');
  });

  it('falls back for unknown errors', () => {
    expect(describeRefundError({ status: 500, message: 'boom' })).toBe('Failed to issue refund. Please try again.');
  });

  it('detects the unconfirmed state', () => {
    expect(isRefundUnconfirmed({ code: 'refund_unconfirmed' })).toBe(true);
    expect(isRefundUnconfirmed({ code: 'refund_rejected' })).toBe(false);
  });
});

describe('describeStatusChangeError', () => {
  it.each([
    ['invalid_transition', "That status change isn't allowed from the order's current status."],
    ['payment_required', "Order isn't paid."],
    ['refund_not_issued', 'Issue the refund before marking the order refunded.'],
    ['tracking_number_in_use', 'This tracking number is already used by another order.'],
  ])('maps %s', (code, text) => {
    expect(describeStatusChangeError({ status: 409, code, message: 'raw' })).toBe(text);
  });

  it('shows the backend message for not_cancellable', () => {
    expect(describeStatusChangeError({ status: 409, code: 'not_cancellable', message: 'Cannot cancel after printing has started' }))
      .toBe('Cannot cancel after printing has started');
  });
});

describe('login lockout', () => {
  it('detects 429', () => {
    expect(isRateLimited({ status: 429 })).toBe(true);
    expect(isRateLimited({ status: 401 })).toBe(false);
  });
  it('uses the lockout copy for 429 and the server message otherwise', () => {
    expect(loginErrorMessage({ status: 429, message: 'Too many requests' })).toBe('Too many attempts, try again in a few minutes');
    expect(loginErrorMessage({ status: 401, message: 'Invalid credentials' })).toBe('Invalid credentials');
    expect(loginErrorMessage(null)).toBe('Login failed. Please try again.');
  });
});

describe('set-password', () => {
  it('enforces 12 characters', () => {
    expect(passwordLengthError('a'.repeat(11))).not.toBeNull();
    expect(passwordLengthError('a'.repeat(12))).toBeNull();
  });
  it('maps 400 and 422', () => {
    expect(setPasswordErrorMessage({ status: 400 })).toMatch(/invalid or has expired/);
    expect(setPasswordErrorMessage({ status: 422, message: 'Password is too common' })).toBe('Password is too common');
    expect(setPasswordErrorMessage({ status: 500 })).toMatch(/Could not set/);
  });
});
