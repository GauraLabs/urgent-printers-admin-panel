import { isRateLimited } from './validationErrors';

export const LOGIN_RATE_LIMITED_MESSAGE = 'Too many attempts, try again in a few minutes';

export function loginErrorMessage(err: unknown): string {
  if (isRateLimited(err)) return LOGIN_RATE_LIMITED_MESSAGE;
  return typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : 'Login failed. Please try again.';
}
