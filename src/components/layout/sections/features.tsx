'use client';

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PenLine, Brain, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/* ─── Mini previews — neutral palette, gold for key values ─────────── */

function GradingPreview({ inView }: { inView: boolean }) {
  const rows = [
    { q: 1, score: 12, max: 15, error: null },
    { q: 2, score: 20, max: 20, error: null },
    { q: 3, score: 8,  max: 15, error: "Omission" },
    { q: 4, score: 15, max: 20, error: "Precision" },
  ];
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 text-xs font-mono">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Script — Q1–Q4</span>
        <span className="text-sm font-bold text-[#926C15]">85 / 100</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={row.q} className="flex items-center gap-2.5">
            <span className="w-5 shrink-0 text-muted-foreground/40">Q{row.q}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
              <motion.div
                className={cn("h-full rounded-full", row.error ? "bg-muted-foreground/40" : "bg-[#926C15]/70")}
                initial={{ width: 0 }}
                animate={inView ? { width: `${(row.score / row.max) * 100}%` } : {}}
                transition={{ duration: 0.7, delay: 0.5 + i * 0.08, ease }}
              />
            </div>
            <span className={cn("w-9 text-right font-bold text-[11px]", row.error ? "text-muted-foreground" : "text-[#926C15]")}>
              {row.score}/{row.max}
            </span>
            {row.error ? (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {row.error}
              </span>
            ) : (
              <span className="shrink-0 w-16" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BloomsPreview({ inView }: { inView: boolean }) {
  const levels = [
    { name: "Remember",   pct: 92 },
    { name: "Understand", pct: 75 },
    { name: "Apply",      pct: 58 },
    { name: "Analyze",    pct: 40 },
    { name: "Evaluate",   pct: 26 },
    { name: "Create",     pct: 12 },
  ];
  return (
    <div className="space-y-2">
      {levels.map((l, i) => (
        <div key={l.name} className="flex items-center gap-3 text-[11px]">
          <span className="w-20 shrink-0 text-muted-foreground/60">{l.name}</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-foreground/25"
              initial={{ width: 0 }}
              animate={inView ? { width: `${l.pct}%` } : {}}
              transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease }}
            />
          </div>
          <span className="w-7 text-right text-muted-foreground/40">{l.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function ErrorPreview({ inView }: { inView: boolean }) {
  const bars = [
    { label: "Precision Error", pct: 83 },
    { label: "Omission Error",  pct: 17 },
  ];
  return (
    <div className="space-y-4">
      {bars.map((b, i) => (
        <div key={b.label}>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">{b.label}</span>
            <span className="font-semibold text-foreground">{b.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full bg-foreground/30"
              initial={{ width: 0 }}
              animate={inView ? { width: `${b.pct}%` } : {}}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.15, ease }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground/50">
        <span className="h-1.5 w-1.5 rounded-full bg-[#926C15]" />
        3 students flagged for intervention
      </div>
    </div>
  );
}

function LoopPreview({ inView }: { inView: boolean }) {
  const steps = ["Grade", "Diagnose", "Intervene", "Measure"];
  return (
    <div className="flex items-end gap-1">
      {steps.map((step, i) => (
        <motion.div
          key={step}
          className="flex flex-1 flex-col items-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50">
            <span className="text-[10px] font-black text-[#926C15]">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{step}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────── */

interface CardProps {
  icon: React.ElementType;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  preview: React.ReactNode;
  className?: string;
  delay?: number;
  inView: boolean;
}

function BentoCard({ icon: Icon, number, title, subtitle, description, preview, className, delay = 0, inView }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-[#926C15]/30 hover:shadow-lg hover:shadow-[#926C15]/5",
        className
      )}
    >
      {/* Top accent line — appears on hover only */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#926C15]/0 to-transparent transition-all duration-500 group-hover:via-[#926C15]/60" />

      {/* Preview */}
      <div className="flex-1 p-6 pb-4">
        {preview}
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-border" />

      {/* Text */}
      <div className="px-6 py-5">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#926C15]/10">
            <Icon className="h-3.5 w-3.5 text-[#926C15]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#926C15]">
            {number} · {subtitle}
          </span>
        </div>
        <p className="mb-1.5 text-base font-bold text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

/* ─── Section ───────────────────────────────────────────────────────── */

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-6xl">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-12 text-center space-y-4"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">What Mirror Does</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">The full teaching loop, complete.</h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            Most tools grade. Some report. Mirror closes the loop from assessment to intervention to measurable impact.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <BentoCard
            className="md:col-span-3"
            delay={0.1} inView={inView}
            icon={PenLine} number="01"
            title="AI Grading"
            subtitle="Handwritten & Digital"
            description="Grade any assessment in minutes. Handwritten, typed, or scanned — every mark annotated and justified against your marking scheme."
            preview={<GradingPreview inView={inView} />}
          />
          <BentoCard
            className="md:col-span-2"
            delay={0.2} inView={inView}
            icon={Brain} number="02"
            title="Bloom's Diagnosis"
            subtitle="Cognitive Depth"
            description="Map every student's cognitive depth across all six Bloom's levels so you know exactly where understanding breaks down."
            preview={<BloomsPreview inView={inView} />}
          />
          <BentoCard
            className="md:col-span-2"
            delay={0.3} inView={inView}
            icon={AlertTriangle} number="03"
            title="Error Patterns"
            subtitle="Root Cause Analysis"
            description="Precision, Omission, Conceptual — automatically classified so you know what to reteach and who needs urgent intervention."
            preview={<ErrorPreview inView={inView} />}
          />
          <BentoCard
            className="md:col-span-3"
            delay={0.4} inView={inView}
            icon={RefreshCw} number="04"
            title="Teaching Loop"
            subtitle="Closed-Loop Intelligence"
            description="Grade → Diagnose → Intervene → Measure. The only platform that auto-closes the full teaching loop and tracks measured impact."
            preview={<LoopPreview inView={inView} />}
          />
        </div>

      </div>
    </section>
  );
}
