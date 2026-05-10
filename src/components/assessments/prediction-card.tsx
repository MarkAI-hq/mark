'use client';

import { TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { PredictionResult } from '@/types/curricula';

interface PredictionCardProps {
  prediction: PredictionResult;
  status: 'passed' | 'flagged' | 'overridden' | 'failed' | 'not_audited';
}

export function PredictionCard({ prediction, status }: PredictionCardProps) {
  const { predicted_average, range, confidence, factors } = prediction;
  const isFlagged    = status === 'flagged';
  const totalPenalty = Number(
    ((factors.cognitive_penalty ?? 0) + (factors.topic_penalty ?? 0)).toFixed(2),
  );

  return (
    <Card className={cn(
      'overflow-hidden shadow-md transition-all duration-500',
      isFlagged ? 'border-amber-500/50 bg-amber-50/30' : 'border-primary/20',
    )}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <CardHeader className={cn(
        'border-b py-4 flex flex-row items-center justify-between space-y-0',
        isFlagged ? 'bg-amber-500/10' : 'bg-primary/5',
      )}>
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg', isFlagged ? 'bg-amber-500/20' : 'bg-primary/10')}>
            {isFlagged
              ? <AlertTriangle className="h-5 w-5 text-amber-600" />
              : <TrendingUp className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <CardTitle className="text-lg">National Prediction</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider font-bold">
              {isFlagged ? 'Unreliable — Low Alignment' : 'National Exam Baseline'}
            </CardDescription>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1.5 bg-background cursor-help">
                Confidence: {isFlagged ? 'Low' : `${Math.round(confidence * 100)}%`}
                <Info className="h-3 w-3 text-muted-foreground" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-xs">
              {isFlagged
                ? 'This prediction is highly speculative because the assessment does not align with the national curriculum.'
                : 'This score is based on historical national exam data and the alignment of this specific paper.'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">
            Predicted National Mean
          </span>

          <div className={cn(
            'flex items-center justify-center rounded-2xl p-6 w-full border',
            isFlagged
              ? 'bg-amber-500/5 border-amber-500/10'
              : 'bg-primary/5 border-primary/10',
          )}>
            <span className={cn(
              'text-6xl font-black tracking-tighter animate-in zoom-in duration-500',
              isFlagged ? 'text-amber-600 opacity-50 blur-[1px]' : 'text-primary',
            )}>
              {range[0]}% – {range[1]}%
            </span>
          </div>

          {isFlagged ? (
            <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Warning:</strong> This prediction is penalised by{' '}
                <strong>{totalPenalty}%</strong> due to curriculum gaps. Fix the assessment
                to improve this score.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed max-w-[320px]">
              The national average is predicted to fall within this range based on your
              high-quality paper alignment.
            </p>
          )}
        </div>

        {/* ── Calculation breakdown ───────────────────────────────── */}
        <Accordion type="single" collapsible className="w-full mt-6">
          <AccordionItem value="calculation" className="border-none">
            <AccordionTrigger className="text-xs text-primary hover:no-underline py-2 bg-muted/50 px-4 rounded-lg">
              View Calculation Factors
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-0 px-2">
              <div className="space-y-3 text-sm">

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">National Base Average</span>
                  <span className="font-mono font-bold">{factors.base_average}%</span>
                </div>

                <div className="flex justify-between items-center text-amber-600">
                  <div className="flex flex-col">
                    <span>Cognitive Framework Penalty</span>
                    <span className="text-[10px] text-muted-foreground">
                      {factors.flagged_levels} of {factors.total_levels} levels out of range
                      {' '}(weight: {Math.round((factors.cognitive_weight ?? 0) * 100)}%)
                    </span>
                  </div>
                  <span className="font-mono font-bold">-{factors.cognitive_penalty ?? 0}%</span>
                </div>

                <div className="flex justify-between items-center text-amber-600">
                  <span>Topic Coverage Penalty</span>
                  <span className="font-mono font-bold">-{factors.topic_penalty ?? 0}%</span>
                </div>

                <div className="pt-3 border-t-2 border-dashed flex justify-between items-center font-black text-primary text-base">
                  <span>Final Prediction</span>
                  <span>{predicted_average}%</span>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}