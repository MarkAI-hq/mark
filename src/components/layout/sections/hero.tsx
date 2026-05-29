"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, Sparkles } from "lucide-react";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const imageUrl = isDark
    ? "/assets/screenshots/intel-hero.png"
    : "/assets/screenshots/intel-hero.png";

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-background">
      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022] dark:opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Gold atmospheric glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[1100px] rounded-full bg-[#926C15]/7 blur-[160px] dark:bg-[#926C15]/12" />

      <div className="relative mx-auto max-w-screen-xl px-4 pb-0 pt-24 sm:pt-32 md:pt-40">
        <div className="flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#926C15]/40 bg-[#926C15]/6 px-4 py-1.5 text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#926C15]" />
            <span className="font-semibold text-[#926C15]">Mirror</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground font-medium">Teaching Intelligence</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-4 max-w-[18ch] text-balance text-5xl font-black tracking-tighter leading-[1.03] sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          >
            Every other platform stops somewhere.
          </motion.h1>
          <motion.h1
            custom={2}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-7 text-5xl font-black tracking-tighter leading-[1.03] sm:text-6xl md:text-7xl lg:text-[5.25rem] bg-gradient-to-br from-[#926C15] via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent"
          >
            Mirror doesn&apos;t.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            custom={3}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mb-10 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Schools that don&apos;t know what&apos;s happening in their classrooms are flying blind.
            Mirror grades every assessment, diagnoses every student&apos;s thinking errors, and
            tells you exactly what to do — automatically. Not a tool.
            An operating system for school intelligence.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={4}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#926C15]/30 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:shadow-[#926C15]/40 hover:-translate-y-1 active:translate-y-0"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button
              data-cal-link="tusii-mirror/30min"
              data-cal-namespace="30min"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-all duration-300 hover:border-[#926C15]/60 hover:bg-[#926C15]/6 hover:text-[#926C15] hover:-translate-y-1 active:translate-y-0"
            >
              Get a demo
            </button>
          </motion.div>

          {/* Social proof micro-line */}
          <motion.p
            custom={5}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={fadeUp}
            className="mt-5 text-xs text-muted-foreground/60"
          >
            No credit card required · Set up in under 2 minutes
          </motion.p>
        </div>

        {/* Dashboard screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.96 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 1.0, delay: 0.6, ease }}
          className="relative mx-auto mt-16 max-w-5xl px-2"
        >
          {/* Underglow */}
          <div className="absolute -top-20 left-1/2 h-80 w-4/5 -translate-x-1/2 rounded-full bg-[#926C15]/14 blur-[90px]" />

          {/* Chrome frame */}
          <div className="relative overflow-hidden rounded-2xl border border-[#926C15]/22 shadow-[0_32px_100px_rgba(0,0,0,0.22)] dark:shadow-[0_32px_100px_rgba(0,0,0,0.65)] ring-1 ring-black/8">
            <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#926C15]/75 to-transparent" />
            <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#926C15]/5 to-transparent" />
            <Image
              src={imageUrl}
              alt="Mirror Teaching Intelligence Dashboard"
              width={isMobile ? 400 : 1000}
              height={isMobile ? 250 : 600}
              className="block w-full"
              priority
            />
          </div>

          {/* Bottom fade into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};
