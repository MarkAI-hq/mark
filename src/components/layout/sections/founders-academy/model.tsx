"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FOUNDERS_ACADEMY_COUNTRIES } from "@/config/founders-academy";

const ease = [0.22, 1, 0.36, 1] as const;

function CompareBar({
  label,
  mirror,
  traditional,
  max,
  suffix = "",
}: {
  label: string;
  mirror: number;
  traditional: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mb-1.5 flex items-center gap-3">
        <span className="w-20 shrink-0 text-xs text-muted-foreground">Mirror</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[#926C15]" style={{ width: `${(mirror / max) * 100}%` }} />
        </div>
        <span className="w-14 shrink-0 text-right text-xs font-semibold text-foreground">
          {mirror}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 text-xs text-muted-foreground">Traditional</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${(traditional / max) * 100}%` }} />
        </div>
        <span className="w-14 shrink-0 text-right text-xs font-semibold text-muted-foreground">
          {traditional}{suffix}
        </span>
      </div>
    </div>
  );
}

export function FoundersAcademyModel() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="how-it-works" className="py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease }}
          >
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Elite academics</p>
            <h2 className="mb-5 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl">
              In three hours a day.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              An AI tutor compresses a full academic day into a focused, mastery-based morning —
              mapped to each country&apos;s national curriculum. What used to take seven hours now
              takes three, and every hour it frees up goes straight into building a real business.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            className="flex flex-col gap-8 rounded-2xl border border-border bg-card p-8"
          >
            <CompareBar label="Daily academic hours" mirror={3} traditional={7} max={7} />
            <CompareBar label="Building hours / year" mirror={1000} traditional={30} max={1000} suffix="+" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.15, ease }}
          className="mt-24"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Where it runs</p>
          <h2 className="mb-10 max-w-xl text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl">
            One curriculum. Three national certificates.
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {Object.values(FOUNDERS_ACADEMY_COUNTRIES).map((c) => (
              <div
                key={c.key}
                className="rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:border-[#926C15]/30 hover:shadow-lg hover:shadow-[#926C15]/5"
              >
                <p className="mb-2 text-xl font-black tracking-tight">{c.label}</p>
                <p className="mb-5 text-sm text-muted-foreground">{c.certificate}</p>
                <p className="text-xs font-semibold text-[#926C15]">Guarantee paid in {c.currency}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-xl text-sm text-muted-foreground">
            Academics run online with an AI tutor mapped to each country&apos;s national syllabus.
            Students in Kampala, Nairobi and Kigali also get in-person cohort days and mentor meetups
            at our regional hubs.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
