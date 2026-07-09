'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MobileSidebar } from './MobileSidebar';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils/cn';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', orders: 'Orders', 'printing-queue': 'Printing Queue',
  products: 'Products', new: 'New', categories: 'Categories', customers: 'Customers',
  payments: 'Payments', refunds: 'Refunds', coupons: 'Coupons', content: 'Content',
  banners: 'Banners', testimonials: 'Testimonials', announcements: 'Announcements',
  faqs: 'FAQs', reviews: 'Reviews', shipping: 'Shipping', serviceability: 'Serviceability',
  communications: 'Communications', templates: 'Templates', reports: 'Reports',
  sales: 'Sales', staff: 'Staff', 'activity-log': 'Activity Log', settings: 'Settings',
  general: 'General', operations: 'Operations', notifications: 'Notifications', system: 'System Health',
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const isId = /^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg);
    const label = isId ? 'Detail' : (SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1));
    return { href, label, isLast: i === segments.length - 1 };
  });
}

export function AdminHeader() {
  const breadcrumbs = useBreadcrumbs();
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex items-center h-14 px-4 bg-background border-b border-border transition-[left] duration-200 ease-in-out',
        'left-0 lg:left-[220px]',
        collapsed && 'lg:left-14'
      )}
    >
      <MobileSidebar />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-0.5 overflow-hidden flex-1 min-w-0 ml-2 lg:ml-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-0.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />}
            {crumb.isLast ? (
              <span className="text-[13px] font-semibold text-foreground truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-[13px] text-muted-foreground hover:text-foreground truncate transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-0.5 flex-shrink-0 ml-3">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
