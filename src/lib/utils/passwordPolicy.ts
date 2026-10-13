export const MIN_PASSWORD_LENGTH = 12;

export function passwordLengthError(password: string): string | null {
  return password.length < MIN_PASSWORD_LENGTH
    ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    : null;
}

export function setPasswordErrorMessage(err: unknown): string {
  const e = err as { status?: number; message?: string } | undefined;
  if (e?.status === 400) return 'This link is invalid or has expired. Ask an administrator to send a new one.';
  if (e?.status === 422) return e.message || 'That password is too weak. Choose a longer, less common password.';
  if (e?.status === 429) return 'Too many attempts, try again in a few minutes';
  return 'Could not set your password. Please try again.';
}
