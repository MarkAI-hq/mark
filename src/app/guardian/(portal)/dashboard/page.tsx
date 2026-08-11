import Link from 'next/link'
import { GraduationCap, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getMyChildren } from '@/lib/actions/guardian'

export default async function GuardianDashboardPage() {
  const { data: children, error } = await getMyChildren()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My children</h1>
        <p className="text-sm text-muted-foreground">
          Select a child to see their progress, attendance and billing.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Couldn&apos;t load your children right now. Please try again shortly.
        </p>
      )}

      {!error && children?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No children are linked to this account yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children?.map((child) => {
          const initials = `${child.first_name?.[0] ?? ''}${child.last_name?.[0] ?? ''}`.toUpperCase()
          return (
            <Link key={child.student_id} href={`/guardian/children/${child.student_id}`}>
              <Card className="hover:border-gold/50 transition-colors">
                <CardContent className="flex items-center gap-4 py-5">
                  <Avatar className="h-12 w-12">
                    {child.profile_image_url && <AvatarImage src={child.profile_image_url} />}
                    <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                      {initials || <GraduationCap className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {child.organization_name ?? 'Unknown school'}
                      {child.class_name ? ` · ${child.class_name}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
