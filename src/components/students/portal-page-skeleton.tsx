// src/components/students/portal-page-skeleton.tsx
//
// Generic loading placeholder for student portal pages. Every portal page is
// a server component doing a multi-call Promise.all before it can render
// anything — on a slow connection that meant a blank screen the whole time.
// Paired with a sibling loading.tsx in each route segment, Next.js shows this
// automatically while the page's data is still being fetched.

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function PortalPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
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
