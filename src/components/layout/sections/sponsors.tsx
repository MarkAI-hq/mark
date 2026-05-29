"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Marquee } from "@devnomic/marquee";
import "@devnomic/marquee/dist/index.css";

const ease = [0.22, 1, 0.36, 1] as const;

const sponsors = [
  { logo: "/assets/images/unacuall.jpg", name: "UNACU" },
  { logo: "/assets/images/pctechall.jpg", name: "PCTech Magazine" },
  { logo: "/assets/images/hopechannelall.png", name: "Hope Channel" },
  { logo: "/assets/images/cnn.svg", name: "CNN" },
  { logo: "/assets/images/newvision.svg", name: "New Vision" },
  { logo: "/assets/images/adaptiveleap.png", name: "Adaptive Leap" },
];

export default function SponsorMarquee() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="border-y border-border bg-muted/15 py-14">
      <div className="mx-auto max-w-screen-xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="mb-10 flex items-center gap-5"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <p className="shrink-0 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Featured On
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <Marquee className="gap-[5rem] [--duration:40s]">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="flex items-center gap-3 opacity-40 grayscale transition-all duration-400 hover:opacity-80 hover:grayscale-0"
              >
                <Image
                  src={sponsor.logo}
                  alt={`Logo of ${sponsor.name}`}
                  width={72}
                  height={36}
                  className="object-contain"
                />
                <span className="text-sm font-semibold whitespace-nowrap">
                  {sponsor.name}
                </span>
              </div>
            ))}
          </Marquee>
        </motion.div>
      </div>
    </section>
  );
}
