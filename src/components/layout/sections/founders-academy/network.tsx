"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const mentorRoles = [
  "E-commerce & retail",
  "Fintech & payments",
  "Agritech",
  "Marketing & growth",
  "Product & AI tools",
  "Operations & logistics",
  "Sales",
  "Investment & scaling",
];

export function FoundersAcademyNetwork() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 bg-muted/20 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-14 max-w-xl"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Network</p>
          <h2 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
            Work directly with builders across the region.
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Weekly mentorship from founders and operators who&apos;ve built what you want to build.
            Real relationships, not guest lectures.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {mentorRoles.map((role, i) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05 + i * 0.05, ease }}
            >
              <div className="mb-3 flex aspect-square items-center justify-center rounded-2xl border border-border bg-card text-xs text-muted-foreground">
                Mentor photo
              </div>
              <p className="text-sm font-semibold text-foreground">Mentor Name</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
