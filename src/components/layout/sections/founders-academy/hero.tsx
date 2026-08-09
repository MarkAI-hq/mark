"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useFoundersAcademyCountry } from "./country-context";
import { CountrySwitcher } from "./country-switcher";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.11, ease },
  }),
};

export function FoundersAcademyHero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const { country, localAmountDisplay } = useFoundersAcademyCountry();

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022] dark:opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[1100px] rounded-full bg-[#926C15]/7 blur-[160px] dark:bg-[#926C15]/12" />

      <div className="relative mx-auto max-w-screen-xl px-4 pb-24 pt-24 sm:pt-32 md:pt-40">
        <div className="flex flex-col items-center text-center">
          <motion.div
            custom={0}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#926C15]/40 bg-[#926C15]/6 px-4 py-1.5 text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#926C15]" />
            <span className="font-semibold text-[#926C15]">Founders Academy</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground font-medium">Uganda · Kenya · Rwanda</span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-7 max-w-[20ch] text-balance text-5xl font-black tracking-tighter leading-[1.03] sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          >
            Graduate with a national certificate{" "}
            <span className="bg-gradient-to-br from-[#926C15] via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
              and $3,500 in profit.
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-10 max-w-[56ch] text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Four years. Real businesses, mentored by working founders. AI-accelerated academics
            finished before lunch. Students graduate with a national certificate — and $3,500 in
            verified profit, guaranteed.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-8 w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-left"
          >
            <p className="mb-4 text-sm text-muted-foreground">
              For students in <span className="font-semibold text-foreground">{country.label}</span>,
              that&apos;s the <span className="font-semibold text-foreground">{country.certShort}</span>{" "}
              plus <span className="font-semibold text-[#926C15]">{localAmountDisplay}</span> in verified
              profit.
            </p>
            <CountrySwitcher />
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/schools/register"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#926C15]/30 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:shadow-[#926C15]/40 hover:-translate-y-1 active:translate-y-0"
            >
              Apply Now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-all duration-300 hover:border-[#926C15]/60 hover:bg-[#926C15]/6 hover:text-[#926C15] hover:-translate-y-1 active:translate-y-0"
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
