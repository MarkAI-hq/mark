"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const sponsors = [
  { logo: "/assets/images/unacuall.jpg", name: "UNACU" },
  { logo: "/assets/images/pctechall.jpg", name: "PCTech Magazine" },
  { logo: "/assets/images/hopechannelall.png", name: "Hope Channel" },
  { logo: "/assets/images/cnn.svg", name: "CNN" },
  { logo: "/assets/images/newvision.svg", name: "New Vision" },
  { logo: "/assets/images/adaptiveleap.png", name: "Adaptive Leap" },
];

// Same two claims StatsBar makes further down the page — reused here for
// tile variety in the grid, not new numbers invented for this section.
const stats = [
  { value: "10%", label: "average annual score improvement" },
  { value: "480 hrs", label: "freed per school, per term" },
];

function Tile({
  className = "",
  children,
  delay,
  inView,
}: {
  className?: string;
  children: React.ReactNode;
  delay: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      // Fixed light tile regardless of site theme: these logo assets (jpg/svg
      // with black or transparent marks) are all baked for a white backing,
      // same as Clay's own white bento tiles — a dark tile makes half of
      // them unreadable.
      className={`flex items-center justify-center rounded-2xl bg-white p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function SponsorMarquee() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {/* One big rounded sheet holding the whole bento grid — Clay's
            "trusted by" card treatment, adapted to our actual press logos
            plus two claims StatsBar already makes, for tile variety.
            bg-muted (not bg-card): tiles are hardcoded bg-white so logos
            stay legible in dark mode too — bg-card is *also* pure white in
            light mode, which would make the sheet and its tiles the same
            color and erase the grid definition entirely. */}
        <div className="rounded-[2rem] border border-border bg-muted p-6 shadow-sm sm:p-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease }}
            className="mx-auto mb-8 max-w-xl text-center text-lg font-medium text-foreground sm:text-xl"
          >
            Featured in the press. Built for schools <span className="font-bold">across Uganda</span>.
          </motion.p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sponsors.map((sponsor, i) => (
              <Tile key={sponsor.name} delay={0.05 + i * 0.05} inView={inView} className="h-24">
                <Image
                  src={sponsor.logo}
                  alt={`Logo of ${sponsor.name}`}
                  width={110}
                  height={40}
                  className="max-h-9 w-auto object-contain"
                />
              </Tile>
            ))}

            {stats.map((stat, i) => (
              <Tile
                key={stat.label}
                delay={0.05 + (sponsors.length + i) * 0.05}
                inView={inView}
                className="h-24 flex-col gap-0.5"
              >
                <span className="text-2xl font-black tracking-tight text-[#926C15]">{stat.value}</span>
                <span className="text-center text-[11px] leading-tight text-neutral-500">{stat.label}</span>
              </Tile>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
