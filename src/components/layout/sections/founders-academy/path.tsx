"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useFoundersAcademyCountry } from "./country-context";

const ease = [0.22, 1, 0.36, 1] as const;

const years = [
  { year: "Year 1", title: "Foundation", items: ["Learn the AI toolkit", "30+ customer conversations", "Validate a first idea"], target: "Target: idea validated" },
  { year: "Year 2", title: "Build", items: ["Launch the business", "First paying customers", "Basic systems in place"], target: "Target: $500 profit" },
  { year: "Year 3", title: "Grow", items: ["Reinvest profit", "AI automates the repeatable", "Runs without daily hand-holding"], target: "Target: $1,500 profit" },
];

const rhythm = [
  { time: "8:00", title: "Academics", body: "AI-accelerated, mastery-based, done by early afternoon." },
  { time: "12:30", title: "Standup", body: "Set goals with your mentor. Review yesterday's build." },
  { time: "13:00", title: "Lunch", body: "Recharge with your cohort." },
  { time: "13:30", title: "Build", body: "Your business, your time, with AI tools and mentor support." },
];

export function FoundersAcademyPath() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { localAmountDisplay } = useFoundersAcademyCountry();

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 bg-muted/20 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-14 max-w-xl"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">The path</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Four years. One certificate.</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {years.map((y, i) => (
            <motion.div
              key={y.year}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05 + i * 0.06, ease }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <p className="mb-2 text-xs font-semibold text-[#926C15]">{y.year}</p>
              <p className="mb-4 text-xl font-black tracking-tight">{y.title}</p>
              <ul className="mb-5 space-y-2 text-sm text-muted-foreground">
                {y.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-foreground">{y.target}</p>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.23, ease }}
            className="rounded-2xl bg-foreground p-6 text-background"
          >
            <p className="mb-2 text-xs font-semibold text-[#D4AA30]">Year 4</p>
            <p className="mb-4 text-xl font-black tracking-tight">Prove it</p>
            <ul className="mb-5 space-y-2 text-sm text-background/70">
              <li>Scale the business</li>
              <li>Sit national exams</li>
              <li>Graduate with proof</li>
            </ul>
            <p className="text-sm font-semibold">Target: {localAmountDisplay} + certificate</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mt-20"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Daily rhythm</p>
          <h2 className="mb-10 text-4xl font-black tracking-tight sm:text-5xl">Learn. Build. Repeat.</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {rhythm.map((r, i) => (
              <div key={r.time} className={`border-l-2 pl-5 ${i === 0 ? "border-[#926C15]" : "border-border"}`}>
                <p className="mb-2 text-lg font-black tracking-tight">{r.time}</p>
                <p className="mb-1.5 text-sm font-semibold text-foreground">{r.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
