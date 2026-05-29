"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const stats = [
  {
    value: "480",
    suffix: "hrs",
    label: "freed per school, per term",
    sub: "Time your teachers spend grading — returned to teaching.",
  },
  {
    value: "10%",
    suffix: "",
    label: "average annual score improvement",
    sub: "Measured across Mirror schools from first term to last.",
  },
  {
    value: "100%",
    suffix: "",
    label: "of errors diagnosed by root cause",
    sub: "Not just wrong. Why wrong. Classified every time.",
  },
  {
    value: "6 wks",
    suffix: "",
    label: "before results, Mirror predicts them",
    sub: "National exam forecast built into every assessment cycle.",
  },
];

export function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 px-4">
      {/* Apple-style engraving separator */}
      <div className="flex justify-center mb-16">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>
      <div className="mx-auto max-w-6xl">

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase"
        >
          What Mirror schools already know
        </motion.p>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="space-y-2"
            >
              <div className="flex items-end gap-1.5 leading-none">
                <span className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="mb-1.5 text-base font-bold text-[#926C15]">{stat.suffix}</span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">{stat.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
