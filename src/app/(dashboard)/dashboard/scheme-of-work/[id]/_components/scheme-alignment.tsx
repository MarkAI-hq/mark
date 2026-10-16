'use client'

// src/app/(dashboard)/dashboard/scheme-of-work/[id]/_components/scheme-alignment.tsx
//
// SPEC-03 S3-R1/R32. Shows how well a scheme is tied to the curriculum, what the
// teacher must fix (these block activation), what only the platform can fix
// (shown, never blocking), and the weekly list with a "Link to curriculum"
// action on every week.

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, BookOpen, CheckCircle2, Circle, Info, Link2, Loader2, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getAlignmentCheck, type AlignmentCheck, type SchemeOfWorkEntry,
} from '@/lib/actions/scheme-of-work'
import { LinkOutcomesDialog } from './link-outcomes-dialog'

interface Props {
  schemeId: string
  entries: SchemeOfWorkEntry[]
}

export function SchemeAlignment({ schemeId, entries }: Props) {
  const router = useRouter()
  const [check, setCheck] = useState<AlignmentCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [linking, setLinking] = useState<SchemeOfWorkEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    const res = await getAlignmentCheck(schemeId)
    setLoading(false)
    if (res.error || !res.data) { setFailed(true); return }
    setCheck(res.data)
  }, [schemeId])

  useEffect(() => { void load() }, [load])

  const weeksWithoutRefs = new Set(
    ((check?.blocking.find((b) => b.code === 'ENTRIES_WITHOUT_OUTCOME_REFS')?.detail as { weeks?: number[] } | undefined)?.weeks) ?? [],
  )
  const weeksUnpaired = new Set(
    ((check?.blocking.find((b) => b.code === 'OBJECTIVES_NOT_PAIRED_WITH_OUTCOMES')?.detail as { weeks?: number[] } | undefined)?.weeks) ?? [],
  )
  const p = check?.platform
  const linkedPct = check && check.entries > 0 ? Math.round((check.entries_with_refs / check.entries) * 100) : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            Curriculum alignment
            <Button
              variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs"
              onClick={() => void load()} disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-check
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && !check && (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking this scheme against the curriculum…
            </p>
          )}
          {failed && <p className="text-sm text-slate-500">Could not check alignment right now.</p>}

          {check && (
            <>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>{check.entries_with_refs} of {check.entries} weeks linked to a curriculum outcome</span>
                  <span className="font-medium text-slate-700">{linkedPct}%</span>
                </div>
                <Progress value={linkedPct} className="h-2" />
              </div>

              {check.ok ? (
                <p className="text-sm text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  Every week is linked, so this scheme can be activated and its lessons checked against the curriculum.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> To activate this scheme, fix:
                  </p>
                  {check.blocking.map((b) => (
                    <p key={b.code} className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {b.message}
                    </p>
                  ))}
                </div>
              )}

              {p && (p.refs_without_official_chunk > 0 || p.refs_not_in_curriculum_schema > 0 || p.refs_from_other_class_or_term > 0) && (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> For your information (you don&apos;t need to fix these)
                  </p>
                  {p.refs_without_official_chunk > 0 && (
                    <p className="text-sm text-slate-600">
                      The official curriculum text for {p.refs_without_official_chunk} of {check.refs} linked outcomes
                      isn&apos;t loaded on the platform yet. Lessons on those topics will wait for a teacher&apos;s review until it is.
                    </p>
                  )}
                  {p.refs_not_in_curriculum_schema > 0 && (
                    <p className="text-sm text-slate-600">
                      {p.refs_not_in_curriculum_schema} linked outcome{p.refs_not_in_curriculum_schema === 1 ? ' is' : 's are'} no longer
                      in the curriculum. Use &ldquo;Change&rdquo; on the weeks that use them to re-link.
                    </p>
                  )}
                  {p.refs_from_other_class_or_term > 0 && (
                    <p className="text-sm text-slate-600">
                      {p.refs_from_other_class_or_term} linked outcome{p.refs_from_other_class_or_term === 1 ? '' : 's'} belong to a
                      different class or term in the official syllabus. That&apos;s allowed if you&apos;re teaching them now.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Weekly Topics
            <span className="text-xs font-normal text-muted-foreground ml-1">({entries.length} entries)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No entries yet.</p>
          ) : (
            <div className="divide-y">
              {entries.map((e) => {
                const linked = (e.curriculum_refs?.length ?? 0) > 0
                const needsFix = !linked || weeksUnpaired.has(e.week_number) || weeksWithoutRefs.has(e.week_number)
                return (
                  <div key={e.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="mt-0.5 shrink-0">
                      {e.is_delivered
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Circle className="h-4 w-4 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 shrink-0 w-10">Wk {e.week_number}</span>
                        <span className="text-sm font-medium text-slate-800 truncate">{e.topic}</span>
                        {e.duration_lessons > 1 && (
                          <span className="text-xs text-slate-400 shrink-0">{e.duration_lessons}L</span>
                        )}
                      </div>
                      {e.learning_objectives && e.learning_objectives.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5 ml-12 line-clamp-1">
                          {e.learning_objectives[0]}
                          {e.learning_objectives.length > 1 && ` +${e.learning_objectives.length - 1} more`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {linked
                        ? <Badge variant="outline" className="text-[11px] text-emerald-700 border-emerald-200">Linked · {e.curriculum_refs!.length}</Badge>
                        : <Badge variant="outline" className="text-[11px] text-amber-700 border-amber-300">Not linked</Badge>}
                      <Button
                        size="sm" variant={needsFix ? 'default' : 'outline'}
                        className="h-7 gap-1 text-xs"
                        onClick={() => setLinking(e)}
                      >
                        <Link2 className="h-3.5 w-3.5" /> {linked ? 'Change' : 'Link to curriculum'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkOutcomesDialog
        schemeId={schemeId}
        entry={linking}
        onClose={() => setLinking(null)}
        onLinked={() => { void load(); router.refresh() }}
      />
    </div>
  )
}
