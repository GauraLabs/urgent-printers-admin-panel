'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants/routes';

const SETTINGS_TABS = [
  { label: 'General', href: ROUTES.SETTINGS_GENERAL },
  { label: 'Operations', href: ROUTES.SETTINGS_OPERATIONS },
  { label: 'Notifications', href: ROUTES.SETTINGS_NOTIFICATIONS },
  { label: 'Payments', href: ROUTES.SETTINGS_PAYMENTS },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="inline-flex items-center gap-0.5 rounded-lg p-1 bg-muted dark:bg-muted/60"
    >
      {SETTINGS_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5',
              'text-[13px] font-medium whitespace-nowrap select-none',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              active
                ? 'bg-background text-foreground shadow-sm dark:bg-card dark:shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
