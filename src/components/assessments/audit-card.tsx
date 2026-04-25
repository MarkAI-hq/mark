'use client';

import { 
  ShieldCheck, AlertTriangle, Info, CheckCircle2, 
  XCircle, BookOpen, Layout, Zap, Target, 
  ArrowUpRight, Microscope, GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface BandDetail {
  actual_pct: number;
  min_pct:    number;
  max_pct:    number;
  passed:     boolean;
}

interface AuditFinding {
  dimension: 'cognitive_coverage' | 'topics' | 'command_words' | 'marks' | 'structure' | 'scaffolding' | 'choice_parity';
  status: 'passed' | 'flagged' | 'info';
  description: string;
  citation?: string;
  details?: {
    band_scores?:   Record<string, number>;
    band_details?:  Record<string, BandDetail>;
    partial_score?: number;
    passed_bands?:  number;
    total_bands?:   number;
    [key: string]: unknown;
  };
}

interface AuditCardProps {
  overallScore: number;
  findings:     AuditFinding[];
  status:       'passed' | 'flagged' | 'failed' | 'overridden' | 'not_audited';
  auditMode?:   'full_paper' | 'classroom_quiz';
  certification?: {
    scaffold_integrity:  number;
    choice_parity_index: number;
    rigor_variance:      number;
    grounding_density:   number;
  };
}

// ── Label Helpers ──────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  cognitive_coverage: 'Cognitive Framework',
  topics:             'Topic Coverage',
  command_words:      'Command Words',
  marks:              'Mark Allocation',
  structure:          'Paper Structure',
  scaffolding:        'Scaffold Integrity',
  choice_parity:      'Section B Fairness',
};

function getDimensionLabel(dimension: string): string {
  return DIMENSION_LABELS[dimension] ?? dimension.replaceAll('_', ' ');
}

const BAND_LABELS: Record<string, string> = {
  k: 'Knowledge',
  u: 'Understanding',
  s: 'Skills',
  a: 'Attitudes',
};

function getBandLabel(key: string): string {
  return BAND_LABELS[key] ?? key.toUpperCase();
}

// ── Sub-Components ─────────────────────────────────────────────────────────

function RigorDial({ variance }: { variance: number }) {
  const rotation = 180 - (variance * 180);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] uppercase font-bold text-muted-foreground">Rigor Profile</span>
      <div className="relative w-16 h-8 overflow-hidden">
        <div className="absolute w-16 h-16 rounded-full border-4 border-muted border-b-transparent" />
        <div className="absolute w-16 h-16 rounded-full border-4 border-transparent border-t-[#c9a84c] border-l-[#c9a84c] -rotate-45" />
        <div
          className="absolute bottom-0 left-1/2 w-0.5 h-7 bg-foreground origin-bottom transition-transform duration-1000"
          style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
        />
      </div>
      <div className="flex justify-between w-full px-1">
        <span className="text-[7px] font-bold">ROTE</span>
        <span className="text-[7px] font-bold">COMPETENCY</span>
      </div>
    </div>
  );
}

function KusaBandBreakdown({ bandScores, bandDetails }: { bandScores: Record<string, number>; bandDetails?: Record<string, BandDetail> }) {
  const bands = Object.entries(bandScores);
  if (bands.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="mt-3 flex gap-2 flex-wrap">
        {bands.map(([key, passed]) => {
          const detail = bandDetails?.[key];
          const isPassed = passed === 1;
          const pill = (
            <div key={key} className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-tight', isPassed ? 'border-[#c9a84c]/40 bg-[#f5edda] text-[#7a6230]' : 'border-amber-200 bg-amber-50 text-amber-700')}>
              {isPassed ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
              {key.toUpperCase()}
            </div>
          );
          if (!detail) return pill;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>{pill}</TooltipTrigger>
              <TooltipContent className="text-[10px] p-2.5 bg-[#1e1c1a] text-white border-[#c9a84c]">
                <p className="font-black uppercase mb-1">{getBandLabel(key)}</p>
                <p>Actual: <span className="font-bold">{detail.actual_pct}%</span></p>
                <p>Target: <span className="font-bold">{detail.min_pct}–{detail.max_pct}%</span></p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AuditCard({ overallScore, findings, status, auditMode = 'full_paper', certification }: AuditCardProps) {
  const isFlagged    = status === 'flagged' || status === 'failed';
  
  // FIX: Exclude 'info' status findings to sync with backend scoring weight math
  const activeFindings = findings.filter(f => f.status !== 'info');
  const passedCount    = activeFindings.filter(f => f.status === 'passed').length;
  const flaggedCount   = activeFindings.filter(f => f.status === 'flagged').length;

  return (
    <Card className={cn('overflow-hidden shadow-lg transition-all duration-500 border-2', isFlagged ? 'border-amber-500/30 bg-amber-50/10' : 'border-[#c9a84c]/20 bg-card')}>
      <CardHeader className={cn('border-b py-4 flex flex-row items-center justify-between space-y-0', isFlagged ? 'bg-amber-500/5' : 'bg-[#f5edda]/30')}>
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl shadow-sm', isFlagged ? 'bg-amber-500/20' : 'bg-[#c9a84c]/20')}>
            {isFlagged ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <ShieldCheck className="h-5 w-5 text-[#7a6230]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold text-[#1e1c1a]">Pedagogical Audit</CardTitle>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 uppercase bg-[#e8d5a3] text-[#7a6230]">{auditMode.replace('_', ' ')}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase">Alignment Score</span>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-4xl font-black', isFlagged ? 'text-amber-600' : 'text-[#7a6230]')}>{overallScore}</span>
                <span className="text-sm font-bold text-muted-foreground">/100</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-[10px] font-bold text-green-700">{passedCount} Dimensions Passed</span>
              </div>
              {flaggedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700">{flaggedCount} Dimensions Flagged</span>
                </div>
              )}
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="findings" className="border-none">
              <AccordionTrigger className="text-[10px] font-black uppercase text-muted-foreground hover:no-underline py-3 bg-muted/40 px-4 rounded-xl">
                Detailed Breakdown
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <ScrollArea className="h-[300px]">
                  {findings.map((finding, i) => (
                    <div key={i} className={cn('p-4 mb-3 rounded-2xl border flex gap-4', finding.status === 'flagged' ? 'border-amber-200 bg-amber-50' : 'bg-card')}>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase">{getDimensionLabel(finding.dimension)}</p>
                        <p className="text-[11px] text-muted-foreground">{finding.description}</p>
                        {finding.dimension === 'cognitive_coverage' && finding.details?.band_scores && (
                          <KusaBandBreakdown bandScores={finding.details.band_scores as Record<string, number>} bandDetails={finding.details.band_details as Record<string, BandDetail>} />
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}