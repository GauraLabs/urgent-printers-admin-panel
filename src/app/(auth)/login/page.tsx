'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Printer, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { loginUser } from '@/lib/api/auth';
import { cn } from '@/lib/utils/cn';
import type { Metadata } from 'next';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await loginUser(values);
      setAuth(res.user, res.access_token);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Login failed. Please try again.';
      setServerError(msg);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center mb-4">
          <Printer className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Urgent Printers</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Admin Panel</p>
      </div>

      {/* Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
        <h2 className="text-base font-medium text-[var(--text-primary)] mb-6">Sign in to your account</h2>

        {/* Server error */}
        {serverError && (
          <div className="flex items-start gap-2.5 p-3 mb-5 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              className={cn(
                'w-full px-3 py-2 text-sm bg-[var(--surface)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors',
                errors.email
                  ? 'border-[var(--danger)] focus:ring-red-400/30'
                  : 'border-[var(--border)]'
              )}
              placeholder="admin@urgentprinters.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className={cn(
                  'w-full pl-3 pr-10 py-2 text-sm bg-[var(--surface)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-colors',
                  errors.password
                    ? 'border-[var(--danger)] focus:ring-red-400/30'
                    : 'border-[var(--border)]'
                )}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 mt-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
