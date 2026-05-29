"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Users, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const UGX_PER_USD = 3700;
const TEACHER_HOURLY_USD = 20;
const TEACHER_HOURLY_UGX = TEACHER_HOURLY_USD * UGX_PER_USD; // 74,000 UGX

function formatUSD(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

function formatUGX(n: number) {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `UGX ${Math.round(n / 1000)}k`;
  return `UGX ${n}`;
}

export function ValueCalculator() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [students, setStudents] = useState(300);
  const [assessments, setAssessments] = useState(6);
  const [currency, setCurrency] = useState<"USD" | "UGX">("USD");

  const scriptsPerTerm = students * assessments;
  const hoursSaved = Math.round((scriptsPerTerm * 13) / 60);
  const hoursAnnual = hoursSaved * 2;
  const atRisk = Math.round(students * 0.15);
  const teachingHours = Math.round(hoursSaved * 0.7);

  const savingsPerTerm = currency === "USD"
    ? formatUSD(hoursSaved * TEACHER_HOURLY_USD)
    : formatUGX(hoursSaved * TEACHER_HOURLY_UGX);

  const savingsAnnual = currency === "USD"
    ? formatUSD(hoursAnnual * TEACHER_HOURLY_USD)
    : formatUGX(hoursAnnual * TEACHER_HOURLY_UGX);

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center space-y-4"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">The Real Cost</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            What is{" "}
            <em className="not-italic bg-gradient-to-r from-[#926C15] to-[#C09020] bg-clip-text text-transparent">not</em>
            {" "}using Mirror costing your school?
          </h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            Every term without Mirror, your teachers are spending hundreds of hours on work
            Mirror does in minutes — while at-risk students go unidentified.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >

          {/* Controls */}
          <div className="border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">

              {/* Students slider */}
              <div className="p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Students enrolled</label>
                  <span className="text-2xl font-black tabular-nums text-foreground">{students}</span>
                </div>
                <input
                  type="range" min={50} max={2000} step={50}
                  value={students}
                  onChange={e => setStudents(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#926C15]"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/50">
                  <span>50 students</span><span>2,000 students</span>
                </div>
              </div>

              {/* Assessments slider */}
              <div className="p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Assessments per term</label>
                  <span className="text-2xl font-black tabular-nums text-foreground">{assessments}</span>
                </div>
                <input
                  type="range" min={1} max={20} step={1}
                  value={assessments}
                  onChange={e => setAssessments(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#926C15]"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/50">
                  <span>1 assessment</span><span>20 assessments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Currency toggle */}
          <div className="flex items-center gap-2 border-b border-border px-7 py-3.5">
            <span className="text-xs text-muted-foreground mr-1">Currency:</span>
            {(["USD", "UGX"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-all duration-200",
                  currency === c
                    ? "bg-[#926C15] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground/50">
              {currency === "USD" ? "@ $20/hr teacher rate" : "@ UGX 74,000/hr teacher rate"}
            </span>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-y-0 sm:divide-x divide-border">

            <div className="p-7 space-y-2">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#926C15]/10">
                <Clock className="h-4 w-4 text-[#926C15]" />
              </div>
              <p className="text-4xl font-black tabular-nums text-foreground">{hoursSaved}</p>
              <p className="text-sm font-semibold text-foreground">teacher-hours freed this term</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Worth{" "}
                <span className="font-bold text-[#926C15]">{savingsPerTerm} this term</span>
                {" "}— {savingsAnnual} annually.{" "}
                {teachingHours} of those hours go back into the classroom.
              </p>
            </div>

            <div className="p-7 space-y-2">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#926C15]/10">
                <Users className="h-4 w-4 text-[#926C15]" />
              </div>
              <p className="text-4xl font-black tabular-nums text-foreground">{atRisk}</p>
              <p className="text-sm font-semibold text-foreground">at-risk students identified</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Mirror flags ~15% of students after every assessment — automatically.{" "}
                <span className="font-semibold text-foreground">
                  Without Mirror, most are invisible until exams.
                </span>
              </p>
            </div>

            <div className="p-7 space-y-2">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#926C15]/10">
                <TrendingUp className="h-4 w-4 text-[#926C15]" />
              </div>
              <p className="text-4xl font-black text-foreground">+10%</p>
              <p className="text-sm font-semibold text-foreground">annual score improvement</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Average across Mirror schools, year on year. Not from harder work —
                from{" "}
                <span className="font-semibold text-foreground">smarter, closed-loop feedback.</span>
              </p>
            </div>

          </div>

          {/* CTA strip */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-muted/20 px-7 py-5 sm:flex-row">
            <p className="text-sm font-semibold text-foreground text-center sm:text-left">
              Mirror doesn&apos;t cost money.{" "}
              <span className="text-[#926C15]">Not using Mirror does.</span>
            </p>
            <button
              data-cal-link="tusii-mirror/30min"
              data-cal-namespace="30min"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#926C15] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#926C15]/25 transition-all duration-200 hover:bg-[#7A5A10] hover:shadow-[#926C15]/35 hover:-translate-y-0.5"
            >
              Book a call
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
