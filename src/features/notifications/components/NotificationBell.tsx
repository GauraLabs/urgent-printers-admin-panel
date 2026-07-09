'use client';

import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useAdminNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
} from '../hooks/useAdminNotifications';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import type { AdminNotification } from '@/lib/api/adminNotifications';

function resolveHref(notification: AdminNotification): string | null {
  if (!notification.event_type.startsWith('order.')) return null;
  const orderId = notification.data?.order_id;
  if (orderId == null) return null;
  return ROUTES.ORDER_DETAIL(String(orderId));
}

export function NotificationBell() {
  const router = useRouter();
  const { data, isLoading } = useAdminNotifications({ page_size: 10 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleSelect(notification: AdminNotification) {
    if (!notification.is_read) markRead.mutate(notification.id);
    const href = resolveHref(notification);
    if (href) router.push(href);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAllRead.mutate();
              }}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleSelect(notification)}
                className={cn(
                  'flex-col items-start gap-0.5 whitespace-normal py-2.5 px-3 rounded-none',
                  !notification.is_read && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-2 w-full">
                  {!notification.is_read && (
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  )}
                  <div className={cn('flex-1 min-w-0', notification.is_read && 'pl-3.5')}>
                    <p className="text-[13px] font-medium text-foreground leading-tight">
                      {notification.title}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {notification.created_at ? formatTimeAgo(notification.created_at) : ''}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
