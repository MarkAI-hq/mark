'use client'

import Link from 'next/link'
import { BookOpen, AlertCircle, ChevronRight, FileText, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CurriculumSchemaMetadata } from '@/types/curricula'

const LEVEL_LABELS: Record<string, { label: string; order: number }> = {
  primary: { label: 'Primary',                    order: 1 },
  ple:     { label: 'Primary Leaving',             order: 1 },
  uce:     { label: 'O-Level (UCE)',               order: 2 },
  uace:    { label: 'A-Level (UACE)',              order: 3 },
  gcse:    { label: 'GCSE',                        order: 2 },
  alevel:  { label: 'A-Level',                     order: 3 },
  kcse:    { label: 'KCSE',                        order: 2 },
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active:     'default',
  draft:      'secondary',
  in_review:  'outline',
  deprecated: 'destructive',
}

function getLevelLabel(raw: string) {
  const key = raw.toLowerCase()
  return LEVEL_LABELS[key]?.label ?? raw.toUpperCase()
}

function getLevelOrder(raw: string) {
  return LEVEL_LABELS[raw.toLowerCase()]?.order ?? 99
}

interface Props {
  curricula:      CurriculumSchemaMetadata[]
  error:          string | null
  noSubjectsYet?: boolean
}

export function CurriculumLibraryClient({ curricula, error, noSubjectsYet }: Props) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (curricula.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <BookOpen className="h-10 w-10 opacity-25" />
          {noSubjectsYet ? (
            <>
              <p className="text-sm font-medium">No subjects assigned yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your curriculum will appear here once your admin assigns you to a class. Check back after your administrator sets up your classes.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">No curriculum schemas loaded</p>
              <p className="text-xs text-muted-foreground">
                Check that the curricula directory is correctly configured (CURRICULA_ROOT env var).
              </p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Group by country → body → level
  const groups = new Map<string, Map<string, CurriculumSchemaMetadata[]>>()
  for (const c of curricula) {
    const country = c.country ?? 'Unknown'
    const body    = c.curriculum_body?.toUpperCase() ?? 'Unknown'
    if (!groups.has(country)) groups.set(country, new Map())
    const byBody = groups.get(country)!
    const key    = `${body}__${c.curriculum_level}`
    if (!byBody.has(key)) byBody.set(key, [])
    byBody.get(key)!.push(c)
  }

  // Sort levels within each body
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/30">
        <span className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          <strong className="text-foreground">{curricula.length}</strong> schemas loaded
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          {new Set(curricula.map(c => `${c.curriculum_body} ${c.curriculum_level}`)).size} exam levels
        </span>
        <span className="flex items-center gap-1.5">
          {new Set(curricula.map(c => c.country)).size} countr{new Set(curricula.map(c => c.country)).size === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {sortedGroups.map(([country, byBody]) => {
        // Collect all body+level combos, sort by level order
        const levelGroups = Array.from(byBody.entries())
          .sort(([aKey], [bKey]) => {
            const aLevel = aKey.split('__')[1] ?? ''
            const bLevel = bKey.split('__')[1] ?? ''
            return getLevelOrder(aLevel) - getLevelOrder(bLevel)
          })

        return (
          <div key={country} className="space-y-4">
            <h2 className="text-base font-semibold border-b pb-2">{country}</h2>

            {levelGroups.map(([bodyLevelKey, items]) => {
              const [body, level] = bodyLevelKey.split('__')
              const sorted = [...items].sort((a, b) =>
                a.subject.localeCompare(b.subject)
              )

              return (
                <div key={bodyLevelKey} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {body} — {getLevelLabel(level ?? '')}
                    </h3>
                    <span className="text-xs text-muted-foreground/60">
                      ({sorted.length} subject{sorted.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {sorted.map((c) => (
                      <Link
                        key={c.id}
                        href={`/dashboard/curricula/${c.id}`}
                        className="group block"
                      >
                        <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all">
                          <CardHeader className="pb-2 pt-4 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                                {c.subject}
                              </CardTitle>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 group-hover:text-primary transition-colors mt-0.5" />
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono">
                                {c.subject_code}
                              </Badge>
                              <Badge
                                variant={STATUS_VARIANT[c.status] ?? 'secondary'}
                                className="text-xs px-1.5 py-0"
                              >
                                {c.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              v{c.version}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
