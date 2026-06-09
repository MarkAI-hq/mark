"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { getYear } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { useTheme } from "next-themes";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const calAttrs = {
  "data-cal-link": "tusii-mirror/30min",
  "data-cal-namespace": "30min",
  "data-cal-config": '{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}',
};

const links: Record<string, { label: string; href: string; cal?: boolean }[]> = {
  Contact: [
    { label: "founding@mirror.education", href: "mailto:founding@mirror.education" },
    { label: "+256-776-289-124", href: "tel:+256776289124" },
    { label: "Get a Demo", href: "", cal: true },
  ],
  Platforms: [
    { label: "iOS", href: "#" },
    { label: "Android", href: "#" },
    { label: "Web", href: "#" },
  ],
  Help: [
    { label: "Contact Us", href: "mailto:founding@mirror.education" },
    { label: "FAQ", href: "/#faq" },
    { label: "Privacy Policy", href: "/assets/MarkPP.pdf" },
  ],
  Socials: [
    { label: "Product Hunt", href: "#" },
    { label: "Discord", href: "#" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/xrmark" },
  ],
};

export const FooterSection = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });
  const footerInView = useInView(footerRef, { once: true, margin: "-60px" });

  useEffect(() => setMounted(true), []);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/assets/images/markBlackBg.png"
      : "/assets/images/markWhiteBg.png";

  return (
    <>
      {/* ── Big CTA band ──────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        className="relative overflow-x-hidden border-y border-border bg-background py-24 sm:py-32 px-4"
      >
        {/* Noise */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,hsl(42_75%_33%/0.08),transparent)]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease }}
            className="mb-5 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase"
          >
            Teaching Intelligence
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.08, ease }}
            className="mb-3 text-4xl font-black tracking-tighter leading-[1.04] sm:text-5xl md:text-6xl"
          >
            The schools that will lead
            <br />
            the next decade
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.14, ease }}
            className="mb-8 text-3xl font-black tracking-tighter sm:text-4xl md:text-5xl bg-gradient-to-r from-[#D4A830] via-[#C09020] to-[#926C15] bg-clip-text text-transparent"
          >
            are already on Mirror.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mb-10 mx-auto max-w-lg text-base text-muted-foreground"
          >
            The full teaching loop — quality audit, AI grading, root-cause diagnosis,
            intervention recommendations, and impact tracking — in one closed-loop system.
            Built for schools that refuse to leave outcomes to chance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.26, ease }}
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#926C15]/30 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:shadow-[#926C15]/40 hover:-translate-y-1 active:translate-y-0"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button
              {...calAttrs}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-all duration-300 hover:border-[#926C15]/60 hover:text-[#926C15] hover:-translate-y-1"
            >
              Schedule a demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer grid ───────────────────────────────────────────── */}
      <footer ref={footerRef} className="bg-background" id="footer-grid">
        <div className="mx-auto max-w-screen-xl px-4 py-14 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={footerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="grid grid-cols-2 gap-10 lg:grid-cols-5"
          >
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <Image src={logoSrc} alt="Mirror Intelligence" width={110} height={36} />
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-[200px]">
                Mirror Intelligence. Teaching, Learning & School Insights — in one closed loop.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(links).map(([title, items]) => (
              <div key={title}>
                <p className="mb-4 text-xs font-bold tracking-widest text-foreground uppercase">
                  {title}
                </p>
                <ul className="space-y-2.5">
                  {items.map(({ label, href, cal }) => (
                    <li key={label}>
                      {cal ? (
                        <button
                          {...calAttrs}
                          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-[#926C15]"
                        >
                          {label}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-[#926C15]"
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {getYear(new TZDate(new Date(), tz))} Mirror Intelligence. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/assets/MarkPP.pdf"
                target="_blank"
                className="text-xs text-muted-foreground transition-colors hover:text-[#926C15]"
              >
                Privacy Policy
              </Link>
              <Link
                href="/#faq"
                className="text-xs text-muted-foreground transition-colors hover:text-[#926C15]"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
      {/* ── Giant wordmark closer ─────────────────────────────────── */}
      <WordmarkCloser />
    </>
  );
};

function WordmarkCloser() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="overflow-x-hidden bg-background border-t border-border px-4 sm:px-8 pt-10 pb-16"
    >
      {["Mirror", "Intelligence"].map((word, i) => (
        <motion.p
          key={word}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="block font-black leading-[1] tracking-tighter select-none bg-gradient-to-r from-[#D4A830] via-[#C09020] to-[#7A5A10] bg-clip-text text-transparent"
          style={{ fontSize: "clamp(3.5rem, 13.8vw, 20rem)" }}
        >
          {word}
        </motion.p>
      ))}
    </div>
  );
}
