"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useFoundersAcademyCountry } from "./country-context";
import { CountrySwitcher } from "./country-switcher";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  "Online application",
  "Aptitude & English assessment",
  "Business challenge + video",
  "Family interview (video call)",
  "Placement & onboarding",
];

export function FoundersAcademyAdmissions() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { country } = useFoundersAcademyCountry();

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease }}
          >
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Admissions</p>
            <h2 className="mb-5 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl">
              Rolling admissions for the 2027 cohort.
            </h2>
            <p className="mb-7 max-w-md text-base leading-relaxed text-muted-foreground">
              Applying as a student in <span className="font-semibold text-foreground">{country.label}</span>?
              You&apos;ll graduate with the {country.certShort} and the guarantee, paid in {country.currency}.
            </p>
            <div className="mb-8">
              <CountrySwitcher />
            </div>
            <Link
              href="/schools/register"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#926C15]/25 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:shadow-[#926C15]/35 hover:-translate-y-1 active:translate-y-0"
            >
              Start application
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <p className="mt-5 text-xs text-muted-foreground">
              Applications for the 2027 cohort close December 15, 2026.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            className="flex flex-col"
          >
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-4 border-b border-border py-5 last:border-b-0">
                <span className="font-mono text-sm font-black text-[#926C15]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium text-foreground">{s}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
