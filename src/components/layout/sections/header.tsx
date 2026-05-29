"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Header() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-24 sm:py-32 px-4">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-muted/20 dark:bg-white/[0.02]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,hsl(42_75%_33%/0.06),transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl aspect-[4/5] shadow-lg">
                <Image
                  src="/assets/images/school.jpg"
                  alt="Students learning"
                  width={600}
                  height={750}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="overflow-hidden rounded-2xl aspect-[4/3] shadow-md">
                <Image
                  src="/assets/images/graduand.jpg"
                  alt="Graduate"
                  width={600}
                  height={450}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
            <div className="pt-10">
              <div className="overflow-hidden rounded-2xl aspect-[3/4] shadow-xl">
                <Image
                  src="/assets/images/enstein.jpg"
                  alt="Einstein"
                  width={600}
                  height={800}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#926C15]/40 bg-[#926C15]/6 px-4 py-1.5 text-sm font-medium text-[#926C15]">
              <Users className="h-3.5 w-3.5" />
              Built with and for educators
            </div>

            <h2 className="text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl">
              Will you help us{" "}
              <span className="bg-gradient-to-br from-[#926C15] via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
                close the loop
              </span>{" "}
              in every classroom?
            </h2>

            <p className="text-base leading-relaxed text-muted-foreground">
              Mirror is built on teaching science, not just language models. We partner
              with expert educators, curriculum designers, and learning scientists to
              encode real pedagogical intelligence into every part of the platform.
            </p>

            <p className="text-base leading-relaxed text-muted-foreground">
              If you have a framework for diagnosing student thinking, a marking methodology
              that works, or a unique approach to intervention — we want to build it into Mirror
              so every teacher on the platform benefits from your expertise.
            </p>

            <button
              data-cal-link="tusii-mirror/30min"
              data-cal-namespace="30min"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#926C15]/25 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:shadow-[#926C15]/35 hover:-translate-y-1 active:translate-y-0"
            >
              Join Us
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
