"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useFoundersAcademyCountry } from "./country-context";

const ease = [0.22, 1, 0.36, 1] as const;

export function FoundersAcademyGuarantee() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { country, localAmountDisplay, guaranteeUsd } = useFoundersAcademyCountry();

  return (
    <section ref={ref} id="guarantee" className="py-28 sm:py-36 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease }}
        className="mx-auto max-w-2xl"
      >
        <p className="mb-5 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">The guarantee</p>
        <h2 className="mb-6 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl md:text-6xl">
          No certificate. No ${guaranteeUsd.toLocaleString()}.{" "}
          <span className="bg-gradient-to-br from-[#926C15] via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
            Full refund.
          </span>
        </h2>
        <p className="mx-auto mb-3 max-w-md text-base leading-relaxed text-muted-foreground">
          Not a scholarship. A bet on you. If a {country.label} student completes all four years
          without the {country.certShort} and {localAmountDisplay} in verified business profit,
          tuition is fully refunded.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Applies to students who enroll and complete all four years. Subject to program terms.
        </p>
      </motion.div>
    </section>
  );
}
