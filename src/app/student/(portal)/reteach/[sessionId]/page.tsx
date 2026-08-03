// src/app/student/(portal)/reteach/[sessionId]/page.tsx

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getStudentReteachHistory } from '@/lib/actions/reteach-history'
import { ReteachSessionContent } from '@/components/reteach/reteach-session-content'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function StudentReteachSessionPage({ params }: Props) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  let user: any = null
  try { user = JSON.parse(decodeURIComponent(userCookie)) }
  catch { redirect('/student/login') }

  const studentId = user?.user_id ?? user?.id
  if (!studentId) redirect('/student/login')

  const { sessionId } = await params

  // Students can only ever see their own history — the backend already scopes
  // `history/student/:studentId` to studentId === the authenticated student.
  const { data: history, error } = await getStudentReteachHistory(studentId)
  const record = history?.find((r) => r.id === sessionId)

  return (
    <div className="space-y-4 animate-fade-up">
      <Link href="/student/my-pathway">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> My Pathway
        </Button>
      </Link>

      {error && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load this session right now. Try again shortly.
          </CardContent>
        </Card>
      )}

      {!error && !record && (
        <Card>
          <CardContent className="py-10 text-center space-y-1">
            <p className="font-medium text-muted-foreground">This session isn&apos;t available</p>
            <p className="text-sm text-muted-foreground/70">
              It may have been superseded by a newer one — check My Pathway for your latest recommended action.
            </p>
          </CardContent>
        </Card>
      )}

      {record && (
        <div className="max-w-2xl mx-auto w-full">
          <ReteachSessionContent session={record.session_data} viewerRole="student" />
        </div>
      )}
    </div>
  )
}
