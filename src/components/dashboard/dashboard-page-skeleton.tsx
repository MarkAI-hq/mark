// src/components/dashboard/dashboard-page-skeleton.tsx
//
// Loading placeholders for admin/teacher dashboard routes. Every dashboard
// page is a server component doing one or more data fetches before it can
// render anything — on a slow connection, or a school with a lot of
// classes/students, that meant a blank frame on every nav click. Paired with
// a sibling loading.tsx in each route segment, Next.js shows the matching
// one of these automatically while the route's data is still loading.
//
// Mirrors the student portal's PortalPageSkeleton pattern (see
// components/students/portal-page-skeleton.tsx) — same idea, four shapes
// instead of one, since the dashboard has more page shapes than the portal.
// No outer page padding here: DashboardShell's content wrapper
// (max-w-7xl px-4 py-5 lg:px-8 lg:py-7) already provides that.

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80" />
    </div>
  )
}

// Generic content pages — a title, a subtitle, a handful of stacked rows.
// Good default for single-purpose pages (overview, help, review-queue, …).
export function DashboardPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <HeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Grid/card-collection pages — classes, students, subjects, curricula,
// exam-builder, study-plans, etc. Title + optional stat strip + a card grid.
export function DashboardGridSkeleton({
  cards = 6,
  stats = 4,
}: {
  cards?: number
  stats?: number
}) {
  return (
    <div className="space-y-6 animate-fade-up">
      <HeaderSkeleton />
      {stats > 0 && (
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: stats }).map((_, i) => (
            <Card key={i} className="flex-1 min-w-[140px]">
              <CardContent className="py-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Table/roster pages — attendance, members, exams list, etc. Title +
// a toolbar row (search/filter placeholders) + table-shaped rows.
export function DashboardTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <HeaderSkeleton />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28 ml-auto" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border/60 px-4 py-3 flex gap-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3.5 flex items-center gap-6 border-b border-border/40 last:border-0"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Detail/tabbed pages — [id] routes, settings pages. Title + a tab strip +
// a couple of content blocks, roughly matching a tabbed detail layout.
export function DashboardDetailSkeleton({ blocks = 2 }: { blocks?: number }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <HeaderSkeleton />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex gap-2 border-b border-border/60 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: blocks }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-5 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
