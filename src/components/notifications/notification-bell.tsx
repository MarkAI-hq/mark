'use client'

// src/components/notifications/notification-bell.tsx

import { useState, useTransition, useEffect } from 'react'
import { Bell, CheckCheck, BrainCircuit, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AppNotification,
  getNotifications,
  markNotificationRead,
} from '@/lib/actions/notifications'

// Poll every 30 seconds while the tab is open so grading completions appear promptly
const POLL_INTERVAL_MS = 30_000

const ICON_MAP: Record<string, React.ReactNode> = {
  GRADING_COMPLETE: <BrainCircuit className="h-4 w-4 text-primary" />,
}

function NotificationIcon({ type }: { type: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      {ICON_MAP[type] ?? <Info className="h-4 w-4 text-muted-foreground" />}
    </span>
  )
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open,          setOpen]          = useState(false)
  const [isPending,     startTransition]  = useTransition()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // --- Fetch on mount and on a polling interval ---
  async function fetchNotifications() {
    const { data } = await getNotifications()
    if (data) setNotifications(data)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // --- Re-fetch when popover opens so count is always fresh ---
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) fetchNotifications()
  }

  // --- Mark one as read and update local state optimistically ---
  function handleMarkRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n,
      ),
    )
    startTransition(async () => {
      await markNotificationRead(notificationId)
    })
  }

  // --- Mark all unread as read ---
  function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.is_read)
    unread.forEach((n) => handleMarkRead(n.notification_id))
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li
                  key={notification.notification_id}
                  className={cn(
                    'flex cursor-pointer gap-3 border-b px-4 py-3 transition-colors last:border-0',
                    'hover:bg-muted/50',
                    !notification.is_read && 'bg-primary/5',
                  )}
                  onClick={() =>
                    !notification.is_read &&
                    handleMarkRead(notification.notification_id)
                  }
                >
                  <NotificationIcon type={notification.type} />

                  <div className="flex-1 space-y-0.5">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        !notification.is_read && 'font-semibold',
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}