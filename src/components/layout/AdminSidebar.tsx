'use client';

import { Printer, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { SidebarNav } from './SidebarNav';
import { ROLE_LABELS } from '@/lib/constants/roles';

export function AdminSidebar() {
  const { collapsed, toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    try { await logoutUser(); }
    finally { logout(); router.replace('/login'); toast.success('Signed out'); }
  }

  const initials = user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'A';

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30',
        'transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-14' : 'w-[220px]'
      )}
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* ── Logo ── */}
      <div
        className={cn('flex items-center h-14 flex-shrink-0', collapsed ? 'justify-center px-3' : 'px-4 gap-3')}
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <Printer className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'var(--sidebar-text-active)' }}>
              Urgent Printers
            </p>
            <p className="text-[10px] leading-tight truncate" style={{ color: 'var(--sidebar-text)' }}>
              Admin Console
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable nav ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <SidebarNav collapsed={collapsed} />
      </div>

      {/* ── User footer ── */}
      <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className={cn('flex items-center gap-2.5 px-3 py-3', collapsed && 'justify-center')}>
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: 'oklch(0.56 0.22 263 / 0.25)', color: 'var(--sidebar-active-text)' }}
          >
            {initials}
          </div>
          {!collapsed && user && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--sidebar-text)' }}>{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="flex-shrink-0 p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'oklch(0.577 0.245 27 / 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sidebar-text)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={toggle}
          className={cn('w-full flex items-center gap-2 py-2.5 px-4 text-[11px] transition-colors', collapsed && 'justify-center px-3')}
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--sidebar-text-active)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }}
        >
          {collapsed
            ? <ChevronsRight className="h-4 w-4" />
            : <><ChevronsLeft className="h-4 w-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
