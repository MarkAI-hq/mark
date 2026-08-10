"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.11, ease },
  }),
};

export const HeroSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative w-full overflow-hidden min-h-[92vh] flex items-center">
      {/* Background photo — a Mirror student's own graduation, not stock imagery */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/graduand.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_25%]"
        />
        {/* Legibility gradient — kept dark on both edges now that text sits
            in both the left (headline) and right (subtext/CTA) columns */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/35" />
        {/* Gold atmospheric glow behind the subject */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full bg-[#926C15]/25 blur-[140px]" />
        {/* Fade into the next section's background instead of cutting hard —
            kept short and pinned to the very bottom edge so it doesn't creep
            up into the "No credit card required" microline above it */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-52 pb-14 w-full">
        {/* Eyebrow link — Clay's "LATEST LAUNCH: TAM SOURCING →" pattern.
            Plain <a>, not next/link: mirror.education is a different site
            entirely (the flagship school's own front door), not a route in
            this app. */}
        <motion.a
          href="https://mirror.education"
          custom={0}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="group mb-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
        >
          <span className="text-[#D4AA30]">Latest launch:</span>{" "}
          <span className="text-white">Mirror Schools</span>
          <ArrowRight className="h-3.5 w-3.5 text-white transition-transform duration-300 group-hover:translate-x-1" />
        </motion.a>

        {/* Headline (left) / subtext + CTAs (right) — bottom-aligned pair,
            matching Clay's split rather than one stacked left column.
            No base `flex-col` here on purpose: Turbopack's (unstable) CSS
            chunking has repeatedly split this page across stylesheets whose
            cascade order conflicts, silently losing `lg:flex-row` to a later
            `flex-col` rule. Plain blocks stack fine on mobile without flex,
            so `lg:flex` alone sidesteps the same-property override entirely. */}
        <div className="gap-8 lg:flex lg:items-end lg:justify-between">
          <div className="mb-8 text-left lg:mb-0">
            <motion.h1
              custom={1}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              variants={fadeUp}
              className="max-w-[14ch] text-balance text-5xl font-black tracking-tighter leading-[1.03] text-white sm:text-6xl lg:text-7xl"
            >
              Solve learning inequalities,
            </motion.h1>
            <motion.h1
              custom={2}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              variants={fadeUp}
              className="mb-6 text-5xl font-black tracking-tighter leading-[1.03] sm:text-6xl lg:text-7xl bg-gradient-to-br from-[#D4AA30] via-[#C09020] to-[#926C15] bg-clip-text text-transparent"
            >
              instantly.
            </motion.h1>
          </div>

          <div className="max-w-sm text-left">
            <motion.p
              custom={3}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              variants={fadeUp}
              className="mb-6 text-lg leading-relaxed text-white/75 drop-shadow-sm sm:text-xl"
            >
              Intelligence Infrastructure to run any curriculum, streamline
              teaching workflows, and launch Mirror Intelligence schools.
            </motion.p>

            <motion.div
              custom={4}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              variants={fadeUp}
              // Turbopack's (unstable) CSS chunking can split this page across two
              // stylesheets whose cascade order conflicts, so `sm:flex-row`
              // sometimes loses to the base `flex-col` regardless of viewport
              // width — flex-wrap sidesteps the breakpoint override entirely.
              className="flex flex-row flex-wrap items-center gap-3"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/30 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              {/* Flat soft-fill secondary, Clay-style — no border/backdrop-blur
                  ring, just a solid light fill, same as "Get a demo" there */}
              <button
                data-cal-link="tusii-mirror/30min"
                data-cal-namespace="30min"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/25 hover:-translate-y-1 active:translate-y-0"
              >
                Get a demo
              </button>
            </motion.div>

            <motion.p
              custom={5}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              variants={fadeUp}
              className="mt-5 text-xs text-white/50"
            >
              No credit card required · Set up in under 2 minutes
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};
