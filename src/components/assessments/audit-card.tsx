'use client';

import {
  ShieldCheck, AlertTriangle, CheckCircle2,
  XCircle, BookOpen, Target, Microscope,
  MessageSquare, BarChart3, Hash, Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface AuditFinding {
  dimension: string;
  status: 'passed' | 'flagged';
  description: string;
  citation?: string;
  details?: Record<string, any>;
}

interface AuditCardProps {
  overallScore: number;
  findings: AuditFinding[];
  status: 'passed' | 'flagged' | 'failed' | 'overridden' | 'not_audited';
  auditMode?: string;
  previousFindings?: AuditFinding[];
  cycleCount?: number;
}

// ── Config ─────────────────────────────────────────────────────────────────

const DIMENSION_CONFIG: Record<string, { label: string; icon: any; description: string }> = {
  blooms: {
    label: 'Bloom\'s Taxonomy',
    icon: Microscope,
    description: 'Cognitive level distribution across remember, understand, apply, analyse, evaluate, create',
  },
  kusa: {
    label: 'KUSA Framework',
    icon: Layers,
    description: 'Knowledge, Understanding, Skills & Attitudes distribution per NCDC framework',
  },
  topics: {
    label: 'Syllabus Coverage',
    icon: BookOpen,
    description: 'Proportion of curriculum topics represented in the assessment',
  },
  command_words: {
    label: 'Command Words',
    icon: MessageSquare,
    description: 'Alignment of instructional verbs with approved UNEB command word list',
  },
  marks: {
    label: 'Mark Allocation',
    icon: Hash,
    description: 'Total marks consistency against schema standard',
  },
};

const KUSA_LABELS: Record<string, string> = {
  k: 'Knowledge',
  u: 'Understanding',
  s: 'Skills',
  a: 'Attitudes',
};

const BLOOM_LABELS: Record<string, string> = {
  remember:  'Remember',
  understand: 'Understand',
  apply:      'Apply',
  analyse:    'Analyse',
  evaluate:   'Evaluate',
  create:     'Create',
};

const BLOOM_COLORS: Record<string, string> = {
  remember:   '#94a3b8',
  understand: '#60a5fa',
  apply:      '#34d399',
  analyse:    '#a78bfa',
  evaluate:   '#f59e0b',
  create:     '#f472b6',
};

// ── Sub-components ─────────────────────────────────────────────────────────

function DistributionBar({
  label,
  actual,
  min,
  max,
  color,
  inRange,
}: {
  label: string;
  actual: number;
  min: number;
  max: number;
  color?: string;
  inRange: boolean;
}) {
  const pct = Math.round(actual * 100);
  const minPct = Math.round(min * 100);
  const maxPct = Math.round(max * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1 cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
              <div className="flex items-center gap-1.5">
                <span className={cn('text-[11px] font-black tabular-nums', inRange ? 'text-[#7a6230]' : 'text-amber-600')}>
                  {pct}%
                </span>
                {inRange
                  ? <CheckCircle2 className="w-3 h-3 text-[#c9a84c]" />
                  : <XCircle className="w-3 h-3 text-amber-500" />}
              </div>
            </div>
            <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: '#f0e8d5' }}>
              {/* Target range band */}
              <div
                className="absolute h-full opacity-30 rounded-full"
                style={{
                  left: `${minPct}%`,
                  width: `${maxPct - minPct}%`,
                  background: color ?? '#c9a84c',
                }}
              />
              {/* Actual value */}
              <div
                className="absolute h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: inRange ? (color ?? '#c9a84c') : '#f59e0b',
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>Target: {minPct}–{maxPct}%</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-[11px] bg-[#1e1c1a] text-white border-[#c9a84c]/40 p-3">
          <p className="font-black uppercase mb-1">{label}</p>
          <p>Actual: <span className="font-bold text-[#c9a84c]">{pct}%</span></p>
          <p>Target range: <span className="font-bold">{minPct}–{maxPct}%</span></p>
          <p className={cn('font-bold mt-1', inRange ? 'text-[#c9a84c]' : 'text-amber-400')}>
            {inRange ? '✓ Within range' : `✗ ${pct < minPct ? `Under by ${minPct - pct}%` : `Over by ${pct - maxPct}%`}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function KusaPanel({ details }: { details: Record<string, any> }) {
  const expected = details?.expected ?? {};
  const actual   = details?.actual   ?? {};
  const keys     = Object.keys(expected);
  if (keys.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {keys.map(cat => {
        const range    = expected[cat] as { min: number; max: number };
        const actualV  = actual[cat]  ?? 0;
        const inRange  = actualV >= range.min && actualV <= range.max;
        return (
          <DistributionBar
            key={cat}
            label={KUSA_LABELS[cat] ?? cat.toUpperCase()}
            actual={actualV}
            min={range.min}
            max={range.max}
            color="#c9a84c"
            inRange={inRange}
          />
        );
      })}
    </div>
  );
}

function BloomsPanel({ details }: { details: Record<string, any> }) {
  const expected = details?.expected ?? {};
  const actual   = details?.actual   ?? {};
  const keys     = Object.keys(expected);
  if (keys.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {keys.map(level => {
        const range   = expected[level] as { min: number; max: number };
        const actualV = actual[level]   ?? 0;
        const inRange = actualV >= range.min && actualV <= range.max;
        return (
          <DistributionBar
            key={level}
            label={BLOOM_LABELS[level] ?? level}
            actual={actualV}
            min={range.min}
            max={range.max}
            color={BLOOM_COLORS[level]}
            inRange={inRange}
          />
        );
      })}
    </div>
  );
}

function CommandWordsPanel({ details }: { details: Record<string, any> }) {
  const invalid = details?.invalid as string[] ?? [];
  if (invalid.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Non-standard words detected</p>
      <div className="flex flex-wrap gap-1.5">
        {invalid.map(w => (
          <span key={w} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
            <XCircle className="w-2.5 h-2.5" />{w}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        These must be replaced with approved UNEB command words.
      </p>
    </div>
  );
}

function TopicsPanel({ details }: { details: Record<string, any> }) {
  const represented = details?.represented as string[] ?? [];
  if (represented.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Topics represented</p>
      <div className="flex flex-wrap gap-1.5">
        {represented.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-[#f5edda] text-[#7a6230] border border-[#e8d5a3]">
            <CheckCircle2 className="w-2.5 h-2.5" />{t}
          </span>
        ))}
      </div>
    </div>
  );
}

function MarksPanel({ details }: { details: Record<string, any> }) {
  const schema = details?.schema_total as number;
  const actual = details?.actual_total as number;
  if (!schema || !actual) return null;

  const ratio  = actual / schema;
  const isLow  = ratio < 0.9;

  return (
    <div className="mt-3 flex items-center gap-6">
      <div className="text-center">
        <p className="text-[9px] uppercase font-black text-muted-foreground">Actual</p>
        <p className={cn('text-2xl font-black', isLow ? 'text-amber-600' : 'text-[#7a6230]')}>{actual}</p>
      </div>
      <div className="flex-1 h-px bg-border relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(ratio * 100, 100)}%`, background: isLow ? '#f59e0b' : '#c9a84c' }}
        />
      </div>
      <div className="text-center">
        <p className="text-[9px] uppercase font-black text-muted-foreground">Schema</p>
        <p className="text-2xl font-black text-foreground/50">{schema}</p>
      </div>
    </div>
  );
}

function FindingDetail({ finding }: { finding: AuditFinding }) {
  if (!finding.details || Object.keys(finding.details).length === 0) return null;

  switch (finding.dimension) {
    case 'kusa':          return <KusaPanel details={finding.details} />;
    case 'blooms':        return <BloomsPanel details={finding.details} />;
    case 'command_words': return <CommandWordsPanel details={finding.details} />;
    case 'topics':        return <TopicsPanel details={finding.details} />;
    case 'marks':         return <MarksPanel details={finding.details} />;
    default:              return null;
  }
}

// ── Diff badge ─────────────────────────────────────────────────────────────

type DiffStatus = 'resolved' | 'still_failing' | 'new' | null;

function computeDiffStatus(
  finding: AuditFinding,
  previousFindings: AuditFinding[] | undefined,
): DiffStatus {
  if (!previousFindings || previousFindings.length === 0) return null;

  const prev = previousFindings.find(p => p.dimension === finding.dimension);

  // Dimension didn't exist in previous audit
  if (!prev) return 'new';

  // Was flagged before, now passed
  if (prev.status === 'flagged' && finding.status === 'passed') return 'resolved';

  // Still flagged
  if (prev.status === 'flagged' && finding.status === 'flagged') return 'still_failing';

  // Was passing before and still passing — no badge needed
  return null;
}

function DiffBadge({ diffStatus }: { diffStatus: DiffStatus }) {
  if (!diffStatus) return null;

  if (diffStatus === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0 h-4 rounded-full text-[8px] font-black uppercase bg-green-100 text-green-700 border border-green-200 shrink-0">
        <CheckCircle2 className="w-2 h-2" />
        Resolved
      </span>
    );
  }

  if (diffStatus === 'still_failing') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0 h-4 rounded-full text-[8px] font-black uppercase bg-red-100 text-red-700 border border-red-200 shrink-0">
        <XCircle className="w-2 h-2" />
        Still flagged
      </span>
    );
  }

  if (diffStatus === 'new') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0 h-4 rounded-full text-[8px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
        New
      </span>
    );
  }

  return null;
}

// ── Diff summary strip ─────────────────────────────────────────────────────

function DiffSummaryStrip({
  findings,
  previousFindings,
}: {
  findings: AuditFinding[];
  previousFindings: AuditFinding[];
}) {
  const resolvedCount = findings.filter(
    f => computeDiffStatus(f, previousFindings) === 'resolved',
  ).length;

  const stillFailingCount = findings.filter(
    f => computeDiffStatus(f, previousFindings) === 'still_failing',
  ).length;

  if (resolvedCount === 0 && stillFailingCount === 0) return null;

  return (
    <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-[#f5edda]/60 border border-[#e8d5a3]/60 flex items-center gap-3 flex-wrap">
      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">
        Since last upload
      </span>
      {resolvedCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          {resolvedCount} resolved
        </span>
      )}
      {stillFailingCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600">
          <XCircle className="w-3 h-3" />
          {stillFailingCount} still failing
        </span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AuditCard({ overallScore, findings, status, previousFindings, cycleCount }: AuditCardProps) {
  const isFlagged   = status === 'flagged' || status === 'failed';
  const passedCount = findings.filter(f => f.status === 'passed').length;
  const flaggedCount = findings.filter(f => f.status === 'flagged').length;
  const hasDiff     = !!previousFindings && previousFindings.length > 0;

  const scoreColor =
    overallScore >= 85 ? '#7a6230' :
    overallScore >= 65 ? '#a8893d' : '#b45309';

  return (
    <Card className={cn(
      'overflow-hidden border-2 transition-all duration-500',
      isFlagged ? 'border-amber-400/30 bg-amber-50/5' : 'border-[#c9a84c]/20 bg-card',
    )}>
      {/* Header */}
      <CardHeader className={cn(
        'border-b py-4 px-5 flex flex-row items-center justify-between space-y-0',
        isFlagged ? 'bg-amber-500/5' : 'bg-[#f5edda]/30',
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', isFlagged ? 'bg-amber-500/15' : 'bg-[#c9a84c]/15')}>
            {isFlagged
              ? <AlertTriangle className="h-5 w-5 text-amber-600" />
              : <ShieldCheck className="h-5 w-5 text-[#7a6230]" />}
          </div>
          <div>
            <CardTitle className="text-base font-black text-[#1e1c1a]">Pedagogical Audit</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
              NCDC · UNEB UCE Framework
              {cycleCount && cycleCount > 1 ? ` · Cycle ${cycleCount}` : ''}
            </p>
          </div>
        </div>

        {/* Score dial */}
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tabular-nums" style={{ color: scoreColor }}>{overallScore}</span>
            <span className="text-xs text-muted-foreground font-bold">/100</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {passedCount > 0 && (
              <span className="text-[9px] font-bold text-green-600 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />{passedCount} passed
              </span>
            )}
            {flaggedCount > 0 && (
              <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />{flaggedCount} flagged
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Score bar */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#f0e8d5' }}>
            {/* Pass threshold marker at 85 */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-green-400/60 z-10" style={{ left: '85%' }} />
            {/* Flag threshold marker at 65 */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60 z-10" style={{ left: '65%' }} />
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${overallScore}%`,
                background: overallScore >= 85
                  ? 'linear-gradient(to right, #c9a84c, #7a6230)'
                  : overallScore >= 65
                    ? 'linear-gradient(to right, #f59e0b, #d97706)'
                    : 'linear-gradient(to right, #fbbf24, #f59e0b)',
              }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-muted-foreground mt-1 px-0.5">
            <span>0</span>
            <span className="text-amber-500">65 flag</span>
            <span className="text-green-600">85 pass</span>
            <span>100</span>
          </div>
        </div>

        {/* Diff summary strip — only shown on re-audits */}
        {hasDiff && (
          <DiffSummaryStrip findings={findings} previousFindings={previousFindings!} />
        )}

        {/* Findings accordion */}
        <div className="px-5 pb-5 pt-2">
          <Accordion type="multiple" defaultValue={findings.filter(f => f.status === 'flagged').map(f => f.dimension)}>
            {findings.map((finding) => {
              const config     = DIMENSION_CONFIG[finding.dimension];
              const Icon       = config?.icon ?? Target;
              const isBad      = finding.status === 'flagged';
              const diffStatus = computeDiffStatus(finding, previousFindings);

              return (
                <AccordionItem
                  key={finding.dimension}
                  value={finding.dimension}
                  className={cn(
                    'mb-2 rounded-xl border px-4 overflow-hidden transition-colors',
                    isBad
                      ? 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20'
                      : 'border-[#e8d5a3]/60 bg-[#fdfaf4]/60',
                  )}
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className={cn(
                        'p-1.5 rounded-lg shrink-0',
                        isBad ? 'bg-amber-100' : 'bg-[#f5edda]',
                      )}>
                        <Icon className={cn('w-3.5 h-3.5', isBad ? 'text-amber-600' : 'text-[#7a6230]')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-foreground">
                            {config?.label ?? finding.dimension.replace(/_/g, ' ')}
                          </span>
                          <Badge
                            className={cn(
                              'text-[8px] font-black uppercase px-1.5 py-0 h-4 border-none',
                              isBad
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-[#f5edda] text-[#7a6230]',
                            )}
                          >
                            {finding.status}
                          </Badge>
                          {/* Diff badge — only shown on re-audits */}
                          <DiffBadge diffStatus={diffStatus} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug pr-4 truncate">
                          {finding.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-4 pt-0">
                    {/* Citation */}
                    {finding.citation && (
                      <p className="text-[9px] text-[#a8893d] font-semibold uppercase tracking-wide mb-3 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" />{finding.citation}
                      </p>
                    )}

                    {/* Dimension description */}
                    {config?.description && (
                      <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed border-l-2 border-[#e8d5a3] pl-3">
                        {config.description}
                      </p>
                    )}

                    {/* Rich detail panel */}
                    <FindingDetail finding={finding} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}