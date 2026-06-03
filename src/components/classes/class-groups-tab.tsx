'use client'

// src/components/classes/class-groups-tab.tsx
// Track 2 — Auto-group students by error domain + generate group interventions

import { useState, useTransition }  from 'react'
import Link                         from 'next/link'
import { toast }                    from 'sonner'
import {
  RefreshCw, Users, AlertTriangle, Brain,
  Pencil, TrendingDown, Zap, Loader2,
} from 'lucide-react'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea }            from '@/components/ui/scroll-area'
import { ReteachSessionContent } from '@/components/reteach/reteach-session-content'
import { getClassGroups }        from '@/lib/actions/classes'
import { generateGroupReteach }  from '@/lib/actions/reteach'
import type { ClassGroupsData, StudentGroup, StudentGroupMember } from '@/lib/actions/classes'
import type { ReteachSession }   from '@/lib/actions/reteach'

// ── Color config ───────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, {
  card:   string
  badge:  string
  icon:   string
  border: string
  btn:    string
}> = {
  red: {
    card:   'border-red-200 bg-red-50',
    badge:  'bg-red-100 text-red-700 border-red-200',
    icon:   'text-red-600',
    border: 'border-red-300',
    btn:    'border-red-200 text-red-700 hover:bg-red-100',
  },
  amber: {
    card:   'border-amber-200 bg-amber-50',
    badge:  'bg-amber-100 text-amber-700 border-amber-200',
    icon:   'text-amber-600',
    border: 'border-amber-300',
    btn:    'border-amber-200 text-amber-700 hover:bg-amber-100',
  },
  blue: {
    card:   'border-blue-200 bg-blue-50',
    badge:  'bg-blue-100 text-blue-700 border-blue-200',
    icon:   'text-blue-600',
    border: 'border-blue-300',
    btn:    'border-blue-200 text-blue-700 hover:bg-blue-100',
  },
  slate: {
    card:   'border-slate-200 bg-slate-50',
    badge:  'bg-slate-100 text-slate-600 border-slate-200',
    icon:   'text-slate-500',
    border: 'border-slate-300',
    btn:    'border-slate-200 text-slate-600 hover:bg-slate-100',
  },
}

const DOMAIN_ICON: Record<string, any> = {
  red:   AlertTriangle,
  amber: Brain,
  blue:  Pencil,
  slate: Users,
}

// ── Single group card ──────────────────────────────────────────────────────

function GroupCard({
  group,
  classId,
  latestAssessmentId,
}: {
  group:               StudentGroup
  classId:             string
  latestAssessmentId?: string
}) {
  const [session,   setSession]   = useState<ReteachSession | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const colors  = COLOR_MAP[group.color] ?? COLOR_MAP.slate
  const Icon    = DOMAIN_ICON[group.color] ?? Users

  const handleGenerate = () => {
    startTransition(async () => {
      const { data, error } = await generateGroupReteach({
        studentIds:    group.students.map(s => s.studentId),
        errorType:     group.topErrors[0] ?? group.domain,
        domain:        group.domain,
        classId,
        assessmentId:  latestAssessmentId,
      })
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to generate group session.')
        return
      }
      setSession(data)
      setPanelOpen(true)
    })
  }

  return (
    <>
      <Card className={`${colors.card} ${colors.border} flex flex-col`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${colors.icon} shrink-0`} />
              <CardTitle className="text-sm">{group.label}</CardTitle>
            </div>
            <Badge variant="outline" className={`text-xs shrink-0 ${colors.badge}`}>
              {group.students.length} student{group.students.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            {group.description}
          </CardDescription>
          {group.topErrors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {group.topErrors.map(e => (
                <span key={e} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${colors.badge}`}>
                  {e}
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 flex flex-col flex-1 gap-4">
          {/* Student list */}
          <div className="divide-y divide-white/60 flex-1">
            {group.students.map(student => (
              <div
                key={student.studentId}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-slate-600">
                    {student.studentName.charAt(0)}
                  </div>
                  <Link
                    href={`/dashboard/classes/${classId}/students/${student.studentId}`}
                    className="text-sm font-medium hover:underline truncate"
                  >
                    {student.studentName}
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {student.avgPct < 50 && (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="text-xs font-semibold text-slate-700">
                    {student.avgPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Generate intervention button */}
          <Button
            size="sm"
            variant="outline"
            className={`w-full gap-2 text-xs ${colors.btn}`}
            onClick={handleGenerate}
            disabled={isPending}
          >
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Zap className="h-3.5 w-3.5" />
            }
            {isPending ? 'Generating session...' : 'Get group intervention'}
          </Button>
        </CardContent>
      </Card>

      {/* Slide-out panel for generated session */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-base">{group.label}</SheetTitle>
            <SheetDescription className="text-xs mt-0.5">
              {group.students.length} students · {group.topErrors[0] ?? group.domain}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            {session && <ReteachSessionContent session={session} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ── Ungrouped card ─────────────────────────────────────────────────────────

function UngroupedCard({ students, classId }: { students: StudentGroupMember[]; classId: string }) {
  if (!students.length) return null
  return (
    <Card className="border-dashed border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" />
            No submissions yet
          </CardTitle>
          <Badge variant="outline" className="text-xs text-slate-500">{students.length}</Badge>
        </div>
        <CardDescription className="text-xs">
          These students haven&apos;t been graded yet and can&apos;t be grouped.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {students.map(s => (
            <Link
              key={s.studentId}
              href={`/dashboard/classes/${classId}/students/${s.studentId}`}
              className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
            >
              {s.studentName}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface ClassGroupsTabProps {
  classId:             string
  initialData:         ClassGroupsData | null
  latestAssessmentId?: string
}

export function ClassGroupsTab({ classId, initialData, latestAssessmentId }: ClassGroupsTabProps) {
  const [data,      setData]      = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const { data: fresh } = await getClassGroups(classId)
      if (fresh) setData(fresh)
    })
  }

  const hasGroups = data && data.groups.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Students grouped by their most common error type. Each group needs a different approach.
          </p>
          {data?.generatedAt && (
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Updated {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Grouping...' : 'Refresh groups'}
        </Button>
      </div>

      {!hasGroups ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          <Users className="h-10 w-10 mb-3 opacity-25" />
          <p className="text-sm font-medium">No groups yet</p>
          <p className="text-xs mt-1 opacity-75">
            Groups appear automatically once students have graded assessments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.groups.map(group => (
              <GroupCard
                key={group.domain}
                group={group}
                classId={classId}
                latestAssessmentId={latestAssessmentId}
              />
            ))}
          </div>
          <UngroupedCard students={data.ungrouped} classId={classId} />
        </div>
      )}
    </div>
  )
}