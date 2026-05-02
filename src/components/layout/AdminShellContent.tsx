'use client';

import { useSidebarStore } from '@/store/sidebarStore';
import { PageTransition } from './PageTransition';
import { cn } from '@/lib/utils/cn';

export function AdminShellContent({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <main
      className={cn(
        'min-h-screen pt-14 transition-[padding-left] duration-200 ease-in-out bg-background',
        'pl-0 lg:pl-60',
        collapsed && 'lg:pl-16'
      )}
    >
      <div className="p-5 sm:p-6 max-w-[1600px]">
        <PageTransition>{children}</PageTransition>
      </div>
    </main>
  );
}
