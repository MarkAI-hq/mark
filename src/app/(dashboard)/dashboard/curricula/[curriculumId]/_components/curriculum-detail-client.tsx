'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ChevronLeft, ChevronDown, ChevronRight,
  BookOpen, Target, FileText, MessageSquare, BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CurriculumSchema } from '@/types/curricula'

const BLOOM_COLORS: Record<string, string> = {
  remember:   'bg-blue-100 text-blue-800',
  understand: 'bg-cyan-100 text-cyan-800',
  apply:      'bg-green-100 text-green-800',
  analyse:    'bg-yellow-100 text-yellow-800',
  evaluate:   'bg-orange-100 text-orange-800',
  create:     'bg-red-100 text-red-800',
}

function BloomBadge({ level }: { level: string }) {
  const cls = BLOOM_COLORS[level.toLowerCase()] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`inline-block text-xs px-1.5 py-0.5 rounded capitalize ${cls}`}>
      {level}
    </span>
  )
}

function TopicRow({ topic }: { topic: any }) {
  const [open, setOpen] = useState(false)
  const loCount = topic.learning_outcomes?.length ?? 0
  const subCount = (topic.subtopics ?? []).length
  const misconCount = (topic.misconceptions ?? []).length

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="flex-1 text-sm font-medium">{topic.name ?? topic.title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {subCount > 0 && (
            <span className="text-xs text-muted-foreground">{subCount} subtopic{subCount !== 1 ? 's' : ''}</span>
          )}
          {loCount > 0 && (
            <span className="text-xs text-muted-foreground">{loCount} LO{loCount !== 1 ? 's' : ''}</span>
          )}
          {topic.weight != null && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {Math.round(topic.weight * 100)}%
            </Badge>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t bg-muted/20">
          {/* Bloom distribution */}
          {topic.bloom_distribution && Object.keys(topic.bloom_distribution).length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Bloom Distribution</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(topic.bloom_distribution as Record<string, number>)
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([level, pct]) => (
                    <span key={level} className="flex items-center gap-1">
                      <BloomBadge level={level} />
                      <span className="text-xs text-muted-foreground">{Math.round(pct * 100)}%</span>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Subtopics */}
          {subCount > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Subtopics</p>
              <ul className="space-y-1">
                {(topic.subtopics as string[]).map((s: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-muted-foreground/40 flex-shrink-0">·</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning outcomes */}
          {loCount > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Learning Outcomes</p>
              <ul className="space-y-1.5">
                {(topic.learning_outcomes as any[]).map((lo: any) => (
                  <li key={lo.id} className="flex items-start gap-2">
                    <code className="text-xs text-muted-foreground/60 flex-shrink-0 mt-0.5">{lo.id}</code>
                    <span className="text-xs text-muted-foreground flex-1">{lo.text}</span>
                    {lo.bloom_level && <BloomBadge level={lo.bloom_level} />}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Misconceptions */}
          {misconCount > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Common Misconceptions</p>
              <ul className="space-y-2">
                {(topic.misconceptions as any[]).map((m: any) => (
                  <li key={m.misconception_id} className="text-xs space-y-0.5">
                    <p className="text-red-700">{m.description}</p>
                    <p className="text-green-700">→ {m.correct_understanding}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  schema: CurriculumSchema
}

export function CurriculumDetailClient({ schema }: Props) {
  const m = schema.metadata
  const topics: any[] = (schema.topics as any[]) ?? []
  const papers = schema.paper_structure?.papers ?? []
  const commandWords = [
    ...(schema.command_words?.overrides ?? []),
    ...(schema.command_words?.subject_specific ?? []),
  ]
  const kusaDist = schema.kusa_distribution_overall as Record<string, number> | undefined

  const totalLOs = topics.reduce((s, t) => s + (t.learning_outcomes?.length ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/curricula"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Curriculum Library
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold">{m.subject}</h1>
            <Badge variant="outline" className="font-mono text-xs">{m.subject_code}</Badge>
            <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>{m.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {m.curriculum_body?.toUpperCase()} · {m.curriculum_level?.toUpperCase()} · {m.country} · v{m.version}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 text-center flex-shrink-0">
          {[
            { label: 'Topics',    value: topics.length },
            { label: 'LOs',       value: totalLOs },
            { label: 'Papers',    value: papers.length },
            { label: 'Cmd Words', value: commandWords.length },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Paper + marks overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Marks</p>
            <p className="text-2xl font-bold">{schema.paper_structure?.total_marks ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
            <p className="text-2xl font-bold">
              {schema.paper_structure?.duration_minutes
                ? `${schema.paper_structure.duration_minutes / 60}h`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pass Threshold</p>
            <p className="text-2xl font-bold">{schema.audit_thresholds?.overall?.pass ?? '—'}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lang Tolerance</p>
            <p className="text-2xl font-bold capitalize">{schema.grading_instructions?.language_tolerance ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* KUSA distribution (if present) */}
      {kusaDist && Object.keys(kusaDist).length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm">Overall KUSA Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {(['k', 'u', 's', 'a'] as const).map((key) => (
              kusaDist[key] != null && (
                <div key={key} className="text-center">
                  <p className="text-lg font-bold">{Math.round((kusaDist[key] as number) * 100)}%</p>
                  <p className="text-xs text-muted-foreground uppercase">{key}</p>
                </div>
              )
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Topics ({topics.length})
          </TabsTrigger>
          <TabsTrigger value="papers" className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Papers ({papers.length})
          </TabsTrigger>
          {commandWords.length > 0 && (
            <TabsTrigger value="commands" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Command Words ({commandWords.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="thresholds" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Thresholds
          </TabsTrigger>
        </TabsList>

        {/* Topics */}
        <TabsContent value="topics" className="mt-4 space-y-2">
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics found in this schema.</p>
          ) : (
            topics.map((t: any) => <TopicRow key={t.topic_id} topic={t} />)
          )}
        </TabsContent>

        {/* Papers */}
        <TabsContent value="papers" className="mt-4 space-y-4">
          {papers.map((paper: any) => (
            <Card key={paper.paper_number}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Paper {paper.paper_number} — {paper.paper_name}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {paper.duration_minutes && (
                      <span>{paper.duration_minutes / 60}h</span>
                    )}
                    <span className="font-medium text-foreground">{paper.marks} marks</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left pb-2 font-medium">Section</th>
                      <th className="text-center pb-2 font-medium">Compulsory</th>
                      <th className="text-center pb-2 font-medium">Available</th>
                      <th className="text-center pb-2 font-medium">Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(paper.sections ?? []).map((s: any) => (
                      <tr key={s.section_id}>
                        <td className="py-2">{s.label}</td>
                        <td className="py-2 text-center">{s.compulsory ? '✓' : '—'}</td>
                        <td className="py-2 text-center">{s.items_available}</td>
                        <td className="py-2 text-center">{s.items_to_answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Command Words */}
        {commandWords.length > 0 && (
          <TabsContent value="commands" className="mt-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr className="border-b">
                    <th className="text-left px-4 py-2.5 font-medium">Word</th>
                    <th className="text-left px-4 py-2.5 font-medium">Bloom</th>
                    <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Definition</th>
                    <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">Expected Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {commandWords.map((cw: any) => (
                    <tr key={cw.word} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-medium">{cw.word}</td>
                      <td className="px-4 py-2.5">
                        {cw.bloom_level && <BloomBadge level={cw.bloom_level} />}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell max-w-[240px]">
                        {cw.definition}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell max-w-[240px]">
                        {cw.expected_response_pattern}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        {/* Thresholds */}
        <TabsContent value="thresholds" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" /> Overall Audit Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                {(['pass', 'flag', 'fail'] as const).map((band) => (
                  <div key={band}>
                    <p className={`text-2xl font-bold ${
                      band === 'pass' ? 'text-green-600' :
                      band === 'flag' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {schema.audit_thresholds?.overall?.[band] ?? '—'}%
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{band}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {schema.audit_thresholds?.scoring_weights && (
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Scoring Weights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(schema.audit_thresholds.scoring_weights as Record<string, number>).map(([dim, weight]) => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-48 flex-shrink-0 capitalize">
                        {dim.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.round(weight * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 text-right">
                        {Math.round(weight * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Grading Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {[
                  { label: 'Accept alternatives',    value: schema.grading_instructions?.accept_alternatives },
                  { label: 'Penalise contradiction', value: schema.grading_instructions?.penalise_contradiction },
                  { label: 'Penalise vagueness',     value: schema.grading_instructions?.penalise_vagueness },
                  { label: 'Require units',          value: schema.grading_instructions?.require_units },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1 border-b last:border-0">
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className={`text-xs font-medium ${value ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {value ? 'Yes' : 'No'}
                    </dd>
                  </div>
                ))}
                <div className="col-span-2 flex items-center justify-between py-1">
                  <dt className="text-muted-foreground text-xs">Language tolerance</dt>
                  <dd className="text-xs font-medium capitalize">{schema.grading_instructions?.language_tolerance}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
