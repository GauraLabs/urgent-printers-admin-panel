import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--text-muted)]">404</h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">Page not found</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
