"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    n: "01",
    title: "Time back",
    body: "AI-accelerated academics free up over 1,000 extra hours a year \u2014 hours traditional school spends on lectures and homework, redirected straight into building.",
  },
  {
    n: "02",
    title: "Real mentors",
    body: "Founders and operators building across Uganda, Kenya and Rwanda, in your corner every week. Direct feedback on your business \u2014 not guest lectures.",
  },
  {
    n: "03",
    title: "AI-native building",
    body: "Learn to build with AI tools from day one \u2014 not as a novelty, but as a core skill. Agents, automation, vibe-coding, mastered before graduation.",
  },
];

export function FoundersAcademyHowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-16 text-4xl font-black tracking-tight sm:text-5xl"
        >
          Why now
        </motion.h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.08 + i * 0.08, ease }}
            >
              <p className="mb-4 font-mono text-sm font-black text-[#926C15]">{s.n}</p>
              <p className="mb-3 text-xl font-black tracking-tight">{s.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
