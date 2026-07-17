'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isToday } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  CheckCheck,
  Info,
  BrainCircuit,
  AlertCircle,
  FileText,
  Send,
  Flag,
  Wand2,
  ClipboardCheck,
  BarChart2,
  UserPlus,
  UserCheck,
  UserX,
  GraduationCap,
  Users,
  Building,
  Shield,
  UserMinus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  CalendarCheck,
  TrendingDown,
  MailCheck,
  Lock,
  UserCircle,
  Sparkles,
} from 'lucide-react'
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
  markAllNotificationsRead,
} from '@/lib/actions/notifications'

const POLL_INTERVAL_MS = 30_000

type IconEntry = { icon: React.ReactNode; bg: string }

const ICON_MAP: Record<string, IconEntry> = {
  // Grading
  GRADING_COMPLETE:            { icon: <BrainCircuit  className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  GRADING_FAILED:              { icon: <AlertCircle   className="h-4 w-4" />, bg: 'bg-destructive/10 text-destructive' },
  // Exam generation
  EXAM_GENERATED:              { icon: <FileText      className="h-4 w-4" />, bg: 'bg-gold/10 text-gold' },
  EXAM_READY:                  { icon: <FileText      className="h-4 w-4" />, bg: 'bg-gold/10 text-gold' },
  EXAM_GENERATION_FAILED:      { icon: <AlertCircle   className="h-4 w-4" />, bg: 'bg-destructive/10 text-destructive' },
  // Assessment lifecycle
  ASSESSMENT_PUBLISHED:        { icon: <Send          className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  ASSESSMENT_AUDIT_FLAGGED:    { icon: <Flag          className="h-4 w-4" />, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  ASSESSMENT_AUDIT_FAILED:     { icon: <AlertCircle   className="h-4 w-4" />, bg: 'bg-destructive/10 text-destructive' },
  REDESIGN_SUGGESTIONS_READY:  { icon: <Wand2         className="h-4 w-4" />, bg: 'bg-gold/10 text-gold' },
  // Submissions / results
  SUBMISSION_RECEIVED:         { icon: <ClipboardCheck className="h-4 w-4" />, bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  RESULTS_READY:               { icon: <BarChart2     className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  // Classes
  CLASS_INVITATION:            { icon: <UserPlus      className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  CLASS_INVITATION_ACCEPTED:   { icon: <UserCheck     className="h-4 w-4" />, bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  CLASS_INVITATION_DECLINED:   { icon: <UserX         className="h-4 w-4" />, bg: 'bg-destructive/10 text-destructive' },
  STUDENT_ENROLLED:            { icon: <GraduationCap className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  STUDENTS_IMPORTED:           { icon: <Users         className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  // Organization
  ORG_INVITATION:              { icon: <Building      className="h-4 w-4" />, bg: 'bg-gold/10 text-gold' },
  ORG_INVITATION_ACCEPTED:     { icon: <UserCheck     className="h-4 w-4" />, bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  CLASS_JOIN_REQUEST:          { icon: <UserPlus      className="h-4 w-4" />, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  CLASS_JOIN_REQUEST_APPROVED: { icon: <UserCheck     className="h-4 w-4" />, bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  CLASS_JOIN_REQUEST_DECLINED: { icon: <UserX         className="h-4 w-4" />, bg: 'bg-destructive/10 text-destructive' },
  USER_ROLE_UPDATED:           { icon: <Shield        className="h-4 w-4" />, bg: 'bg-muted text-muted-foreground' },
  USER_REMOVED:                { icon: <UserMinus     className="h-4 w-4" />, bg: 'bg-destructive/10 text-destructive' },
  // Student-specific
  STUDY_PLAN_ASSIGNED:         { icon: <BookOpen      className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  STUDY_PLAN_COMPLETED:        { icon: <CheckCircle2  className="h-4 w-4" />, bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  AT_RISK_STUDENT:             { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  RETEACH_READY:               { icon: <RefreshCw     className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  // Attendance & gaps
  ATTENDANCE_RECORDED:         { icon: <CalendarCheck className="h-4 w-4" />, bg: 'bg-primary/10 text-primary' },
  GAP_ANALYSIS_COMPLETE:       { icon: <TrendingDown  className="h-4 w-4" />, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  // Account / system
  WELCOME:                     { icon: <Sparkles      className="h-4 w-4" />, bg: 'bg-gold/10 text-gold' },
  EMAIL_VERIFIED:              { icon: <MailCheck     className="h-4 w-4" />, bg: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  PASSWORD_CHANGED:            { icon: <Lock          className="h-4 w-4" />, bg: 'bg-muted text-muted-foreground' },
  PROFILE_UPDATED:             { icon: <UserCircle    className="h-4 w-4" />, bg: 'bg-muted text-muted-foreground' },
}

function NotificationIcon({ type }: { type: string }) {
  const entry = ICON_MAP[type]
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
        entry?.bg ?? 'bg-muted text-muted-foreground',
      )}
    >
      {entry?.icon ?? <Info className="h-4 w-4" />}
    </span>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {label}
    </p>
  )
}

export function NotificationBell() {
  const router                             = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open,          setOpen]          = useState(false)
  const [mounted,       setMounted]       = useState(false)
  const [isPending,     startTransition]  = useTransition()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => { setMounted(true) }, [])

  async function fetchNotifications() {
    const { data } = await getNotifications()
    if (data) setNotifications(data)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) fetchNotifications()
  }

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

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    startTransition(async () => {
      await markAllNotificationsRead()
    })
  }

  function handleItemClick(notification: AppNotification) {
    if (!notification.is_read) handleMarkRead(notification.notification_id)
    const href = notification.metadata?.href as string | undefined
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  const todayItems   = notifications.filter((n) => isToday(new Date(n.createdAt)))
  const earlierItems = notifications.filter((n) => !isToday(new Date(n.createdAt)))

  // Radix Popover derives `aria-controls` from useId; rendering it only after
  // mount keeps the server and first client paint identical (same placeholder),
  // avoiding the hydration id mismatch. Mirrors the ThemeToggle pattern.
  if (!mounted) return <div className="h-9 w-9" />

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 glass">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
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
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/8">
                <Bell className="h-5 w-5 text-gold opacity-30" />
              </span>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <ul>
              {todayItems.length > 0 && (
                <>
                  <SectionHeader label="Today" />
                  {todayItems.map((n) => (
                    <NotificationItem
                      key={n.notification_id}
                      notification={n}
                      onClick={() => handleItemClick(n)}
                    />
                  ))}
                </>
              )}
              {earlierItems.length > 0 && (
                <>
                  <SectionHeader label="Earlier" />
                  {earlierItems.map((n) => (
                    <NotificationItem
                      key={n.notification_id}
                      notification={n}
                      onClick={() => handleItemClick(n)}
                    />
                  ))}
                </>
              )}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: AppNotification
  onClick: () => void
}) {
  // Defensive parser check: catches both camelCase and snake_case models
  const rawDate = notification.createdAt ?? (notification as any).created_at
  const dateObj = rawDate ? new Date(rawDate) : new Date()
  const displayTime = isNaN(dateObj.getTime()) 
    ? 'Recently' 
    : formatDistanceToNow(dateObj, { addSuffix: true })

  return (
    <li
      className={cn(
        'flex cursor-pointer gap-3 border-b border-border/30 px-4 py-3 transition-colors last:border-0',
        'hover:bg-muted/50',
        !notification.is_read && 'bg-gold/5',
      )}
      onClick={onClick}
    >
      <NotificationIcon type={notification.type} />

      <div className="flex-1 space-y-0.5 min-w-0">
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
          {displayTime}
        </p>
      </div>

      {!notification.is_read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
      )}
    </li>
  )
}
