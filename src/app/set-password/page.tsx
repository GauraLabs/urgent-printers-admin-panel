'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { setAdminPassword } from '@/lib/api/auth';
import { MIN_PASSWORD_LENGTH, passwordLengthError, setPasswordErrorMessage } from '@/lib/utils/passwordPolicy';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

function SetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const lengthError = passwordLengthError(password);
    if (lengthError) return setFieldError(lengthError);
    if (password !== confirm) return setFieldError('Passwords do not match');
    setFieldError(null);
    setSubmitting(true);
    try {
      await setAdminPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      setServerError(setPasswordErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = cn(
    'w-full pl-3 pr-10 py-2 text-sm bg-[var(--surface)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors',
    fieldError ? 'border-[var(--danger)]' : 'border-[var(--border)]'
  );

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <Logo variant="color" style={{ height: 36 }} className="mb-3" />
        <p className="text-sm text-[var(--text-muted)]">Admin Panel</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
            <h2 className="text-base font-medium text-[var(--text-primary)]">Password set</h2>
            <p className="text-sm text-[var(--text-muted)]">You can now sign in with your new password.</p>
            <Link
              href={ROUTES.LOGIN}
              className="block w-full py-2 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center space-y-4">
            <h2 className="text-base font-medium text-[var(--text-primary)]">Link is incomplete</h2>
            <p className="text-sm text-[var(--text-muted)]">Open the full link from your invitation email, or ask an administrator to send a new one.</p>
            <Link href={ROUTES.LOGIN} className="text-sm text-[var(--primary)] hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-1">Set your password</h2>
            <p className="text-xs text-[var(--text-muted)] mb-6">Use at least {MIN_PASSWORD_LENGTH} characters.</p>

            {serverError && (
              <div role="alert" className="flex items-start gap-2.5 p-3 mb-5 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">New password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Confirm password</label>
                <input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
                {fieldError && <p className="mt-1.5 text-xs text-[var(--danger)]">{fieldError}</p>}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 mt-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? 'Saving…' : 'Set password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
