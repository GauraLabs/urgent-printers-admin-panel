export const ANOMALY_EVENT_LABELS: Record<string, string> = {
  paid_after_cancel_unrecoverable: 'Paid after cancel',
  webhook_amount_mismatch: 'Webhook amount mismatch',
  provider_paid_amount_mismatch: 'Provider amount mismatch',
  verify_amount_mismatch: 'Verify amount mismatch',
  verify_not_captured: 'Payment not captured',
  sweep_payment_authorized: 'Authorised, not captured',
};

export function anomalyLabel(eventType: string): string {
  return ANOMALY_EVENT_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

export function paiseToRupees(paise: number | null): number | null {
  return paise == null ? null : paise / 100;
}
