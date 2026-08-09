"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const traits = [
  { name: "Leadership", pct: 78 },
  { name: "Grit", pct: 85 },
  { name: "Communication", pct: 68 },
  { name: "Discipline", pct: 90 },
  { name: "Empathy", pct: 72 },
  { name: "Risk-taking", pct: 64 },
];

const aiTools = [
  { name: "Claude", skill: "Reasoning", pct: 82 },
  { name: "Cursor", skill: "Vibe code", pct: 74 },
  { name: "v0", skill: "Frontend", pct: 65 },
  { name: "Midjourney", skill: "Design", pct: 58 },
  { name: "Zapier", skill: "Automation", pct: 70 },
  { name: "Custom agents", skill: "Delegation", pct: 60 },
];

const pipeline = [
  { name: "Tailoring orders", status: "Closed", amount: "$180" },
  { name: "Poultry supply route", status: "Closed", amount: "$340" },
  { name: "School snacks delivery", status: "Active", amount: "$560" },
  { name: "Phone accessories resale", status: "Active", amount: "$290" },
  { name: "Bulk rice contract", status: "Pipeline", amount: "$1,200" },
];

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-[#926C15]" style={{ width: `${pct}%` }} />
    </div>
  );
}

function statusClasses(status: string) {
  if (status === "Closed") return "bg-emerald-500/10 text-emerald-600";
  if (status === "Active") return "bg-[#926C15]/10 text-[#926C15]";
  return "bg-muted text-muted-foreground";
}

export function FoundersAcademyCurriculum() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-14 max-w-xl"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Curriculum</p>
          <h2 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
            Character, business, AI, academics.
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Four pillars, tracked every week. This is a sample of a student&apos;s live dashboard.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="mb-6 flex items-baseline justify-between">
              <p className="text-lg font-black tracking-tight">Character</p>
              <p className="text-xs font-semibold text-[#926C15]">Pillar 01</p>
            </div>
            <div className="space-y-3">
              {traits.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">{t.name}</span>
                  <Bar pct={t.pct} />
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">{t.pct}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-border pt-5 text-sm">
              <span className="text-muted-foreground">Character score</span>
              <span className="font-semibold">76/100</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="mb-6 flex items-baseline justify-between">
              <p className="text-lg font-black tracking-tight">Business</p>
              <p className="text-xs font-semibold text-[#926C15]">Pillar 02</p>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div><p className="text-xl font-black">$2,150</p><p className="text-[11px] text-muted-foreground">Revenue</p></div>
              <div><p className="text-xl font-black">34</p><p className="text-[11px] text-muted-foreground">Customers</p></div>
              <div><p className="text-xl font-black">12%</p><p className="text-[11px] text-muted-foreground">Conv. rate</p></div>
            </div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Deal pipeline</p>
            <div className="space-y-0">
              {pipeline.map((d) => (
                <div key={d.name} className="flex items-center justify-between border-b border-border/60 py-2 text-sm">
                  <span className="text-foreground/80">{d.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClasses(d.status)}`}>
                    {d.status}
                  </span>
                  <span className="font-semibold">{d.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Pipeline value</span>
              <span className="font-semibold">$2,570</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="mb-6 flex items-baseline justify-between">
              <p className="text-lg font-black tracking-tight">AI</p>
              <p className="text-xs font-semibold text-[#926C15]">Pillar 03</p>
            </div>
            <div className="space-y-3">
              {aiTools.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">{a.name}</span>
                  <Bar pct={a.pct} />
                  <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">{a.skill}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-border pt-5 text-sm">
              <span className="text-muted-foreground">Tools equipped</span>
              <span className="font-semibold">6/6</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="rounded-2xl border border-border bg-card p-7"
          >
            <div className="mb-6 flex items-baseline justify-between">
              <p className="text-lg font-black tracking-tight">Academics</p>
              <p className="text-xs font-semibold text-[#926C15]">Pillar 04</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div><p className="text-2xl font-black">78%</p><p className="text-[11px] text-muted-foreground">Practice exam score</p></div>
              <div><p className="text-2xl font-black">7/8</p><p className="text-[11px] text-muted-foreground">Subjects on track</p></div>
              <div><p className="text-2xl font-black">100%</p><p className="text-[11px] text-muted-foreground">Curriculum aligned</p></div>
              <div><p className="text-2xl font-black">3 hrs</p><p className="text-[11px] text-muted-foreground">Daily commitment</p></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
