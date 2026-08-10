'use client'

// src/components/students/completed-plans-table.tsx
//
// Shared searchable table for a student's completed study plans — used on
// both the main Study Plans page and a single subject's detail page, so the
// "completed lessons" list only needs to be built (and fixed) once.

import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Clapperboard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { formatTopicTitle } from '@/lib/utils'

interface CompletedPlanLike {
  id: string
  topic: string
  subject: string
  lesson_type: string
  score_after: number | null
}

const LESSON_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  catch_up:      { label: 'Catch-Up',      color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',       icon: '📚' },
  gap_closure:   { label: 'Gap Closure',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',   icon: '🔍' },
  reteach:       { label: 'Reteach',       color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300', icon: '🔄' },
  pre_class:     { label: 'Pre-Class',     color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',       icon: '⏰' },
  pre_teach:     { label: 'Pre-Teach',     color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', icon: '⚡' },
  consolidation: { label: 'Consolidation', color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',   icon: '✅' },
  exam_prep:     { label: 'Exam Prep',     color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',           icon: '🎯' },
}

function lessonCfg(type: string) {
  return LESSON_TYPE_CONFIG[type] ?? { label: type, color: 'bg-muted text-muted-foreground', icon: '📖' }
}

export function CompletedPlansTable<T extends CompletedPlanLike>({
  plans,
  showSubject = true,
}: {
  plans: T[]
  showSubject?: boolean
}) {
  const columns: ColumnDef<T>[] = [
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground line-clamp-1">
          {formatTopicTitle(row.original.topic)}
        </span>
      ),
    },
    ...(showSubject ? [{
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }: { row: { original: T } }) => <span className="text-xs text-muted-foreground">{row.original.subject}</span>,
    } as ColumnDef<T>] : []),
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const cfg = lessonCfg(row.original.lesson_type)
        return <Badge className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
      },
    },
    {
      accessorKey: 'score_after',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.original.score_after
        if (score == null) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <span className={`text-xs font-semibold tabular-nums ${
            score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'
          }`}>{score}%</span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground hover:text-gold">
          <Link href={`/student/study-plans/${row.original.id}/studio`}>
            <Clapperboard className="h-3 w-3" /> Review
          </Link>
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={plans}
      filter={{ prompt: 'Search completed lessons...', column: 'topic' }}
    />
  )
}
