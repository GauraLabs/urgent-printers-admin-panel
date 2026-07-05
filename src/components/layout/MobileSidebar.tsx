'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { SidebarNav } from './SidebarNav';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/lib/api/auth';
import { ROLE_LABELS } from '@/lib/constants/roles';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutUser();
    } finally {
      logout();
      setOpen(false);
      router.replace('/login');
      toast.success('Signed out successfully');
    }
  }

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'A';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger — hamburger button rendered in header */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <SheetContent side="left" showCloseButton={false} className="w-64 p-0 bg-[var(--sidebar-bg)] border-[var(--sidebar-border)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--sidebar-border)] flex-shrink-0">
          <div className="flex flex-col">
            <Logo variant="color" style={{ height: 22 }} />
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--sidebar-text)' }}>Admin Panel</p>
          </div>
          <SheetClose className="p-1.5 rounded-md text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] transition-colors">
            <X className="h-4 w-4" />
          </SheetClose>
        </div>

        {/* Nav */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-[var(--sidebar-border)] p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--sidebar-active)] flex items-center justify-center text-xs font-semibold text-[var(--sidebar-text-active)] flex-shrink-0">
              {initials}
            </div>
            {user && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--sidebar-text-active)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--sidebar-text)] truncate">{ROLE_LABELS[user.role]}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-shrink-0 p-1.5 rounded-md text-[var(--sidebar-text)] hover:text-red-400 hover:bg-[var(--sidebar-hover)] transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
