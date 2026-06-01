'use client'

// src/app/(dashboard)/dashboard/classes/[id]/reteach/[assessmentId]/page-client.tsx

import { useRouter }                from 'next/navigation'
import { ArrowLeft, Printer, ChevronDown } from 'lucide-react'
import { useState }                from 'react'
import { Button }                  from '@/components/ui/button'
import { Separator }               from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReteachSessionContent }   from '@/components/reteach/reteach-session-content'
import type { ReteachSession }     from '@/lib/actions/reteach'

interface ClassReteachPageClientProps {
  session:         ReteachSession
  classId:         string
  className:       string
  assessmentTitle: string
  errorType:       string
  affected:        number
  total:           number
}

export function ClassReteachPageClient({
  session,
  classId,
  className,
  assessmentTitle,
  errorType,
  affected,
  total,
}: ClassReteachPageClientProps) {
  const router          = useRouter()
  const pct             = total > 0 ? Math.round((affected / total) * 100) : 0
  const [copies, setCopies] = useState(1)

const handleBack = () => {
    // Navigate explicitly rather than router.back() so we land on the
    // interventions tab. router.refresh() invalidates the server cache so
    // the class page re-fetches interventions and shows the new session.
    router.push(`/dashboard/classes/${classId}?tab=interventions`)
    router.refresh()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-500 -ml-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to class
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Printer className="h-4 w-4" />
              Print
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.print()}>
              Full package (teacher + student)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              Teacher guide only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              Student worksheet only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{session.title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {className} · {assessmentTitle}
        </p>
      </div>

      {/* ── Impact summary ───────────────────────────────────────────── */}
      {affected > 0 && (
        <div className="rounded-lg border bg-rose-50 border-rose-100 p-4">
          <p className="text-sm font-medium text-rose-800">
            {affected} of {total} students ({pct}%) showed{' '}
            <span className="font-semibold">{errorType}</span> in this assessment.
          </p>
          <p className="text-xs text-rose-600 mt-1">
            Run this session before moving to the next topic.
          </p>
        </div>
      )}

      <Separator />

      {/* ── Session content ──────────────────────────────────────────── */}
      {session ? (
        <ReteachSessionContent session={session} />
      ) : (
        <p className="text-sm text-slate-500">No session data available.</p>
      )}

    </div>
  )
}