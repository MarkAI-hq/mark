"use client";

import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import Image from "next/image";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const steps = [
  {
    number: "01",
    title: "Quality Audit",
    subtitle: "Before grading begins",
    label: "Assessment Intelligence",
    image: "/assets/screenshots/audit-results.png",
    imagePosition: "object-top",
    description:
      "Every assessment is schema-scored against curriculum before a single answer is graded. Mirror checks the exam itself — flagging ambiguous questions, weak prompts, and curriculum misalignments so your grading data is trustworthy from the start.",
    outcomes: [
      "Question quality score per assessment",
      "Curriculum alignment check against your syllabus",
      "Weak and ambiguous question flags before grading",
      "AI-assisted question redesign suggestions",
    ],
  },
  {
    number: "02",
    title: "AI Grading",
    subtitle: "Schema-enriched, fully annotated",
    label: "Teaching Intelligence",
    image: "/assets/screenshots/marked-shot.png",
    imagePosition: "object-top",
    description:
      "Mirror grades every paper — handwritten, typed, or scanned — with schema-enriched AI. Every mark is justified against your marking scheme, with the specific thinking error identified for each wrong answer.",
    outcomes: [
      "Marks per question with annotation and justification",
      "Handwritten and digital submission support",
      "Per-student score reports generated in minutes",
      "Instant exportable PDF grade reports",
    ],
  },
  {
    number: "03",
    title: "Diagnosis",
    subtitle: "Root cause, not just scores",
    label: "Learning Intelligence",
    image: "/assets/screenshots/class-details.png",
    imagePosition: "object-top",
    description:
      "Mirror classifies every error by root cause, maps cognitive depth on Bloom's taxonomy, and builds a cognitive profile for each student — so you know not just who got it wrong, but why.",
    outcomes: [
      "Bloom's cognitive depth mapping per student",
      "Precision, Omission, and Conceptual error breakdown",
      "Individual cognitive profile for every student",
      "Class-level error pattern analysis and heatmap",
    ],
  },
  {
    number: "04",
    title: "Intervene & Measure",
    subtitle: "Close the loop, track impact",
    label: "School Insights",
    image: "/assets/screenshots/student-results.png",
    imagePosition: "object-top",
    description:
      "Mirror identifies exactly who needs intervention and at what level — individual, group, or class-wide. Then it auto-tracks performance delta across assessments so you can see what's actually working.",
    outcomes: [
      "At-risk students flagged with urgency levels",
      "Individual, group, and class intervention recommendations",
      "Personalised learning toolkit per cognitive profile",
      "Performance delta tracked automatically over time",
    ],
  },
];

/* ─── Desktop scroll-driven section ─────────────────────────────── */

function DesktopSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  // Zip line fill height (0%–100%)
  const lineHeight = useTransform(smooth, [0, 1], ["0%", "100%"]);

  // Active step
  useMotionValueEvent(smooth, "change", (v) => {
    const idx = Math.min(Math.floor(v * steps.length), steps.length - 1);
    setActiveStep(idx);
  });

  // Click-to-scroll
  const scrollToStep = (i: number) => {
    if (!containerRef.current) return;
    const top =
      containerRef.current.getBoundingClientRect().top + window.scrollY;
    const fraction = i / steps.length;
    window.scrollTo({
      top: top + containerRef.current.offsetHeight * fraction,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${steps.length * 100}vh` }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">

        {/* Section header */}
        <div className="shrink-0 pt-10 pb-5 px-4">
          <div className="mx-auto max-w-6xl">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">
              How Mirror Works
            </p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              The Mirror Way.
            </h2>
            <p className="mt-2 hidden sm:block text-sm text-muted-foreground">
              Scroll to explore each step ↓
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 px-4 pb-6">
          <div className="mx-auto max-w-6xl h-full grid grid-cols-[200px_1fr] gap-10 lg:grid-cols-[220px_1fr]">

            {/* ── Left: zip nav ── */}
            <div className="relative flex flex-col justify-center py-2">

              {/* Zip track background */}
              <div className="absolute left-[15px] top-0 bottom-0 w-[2px] rounded-full bg-border" />

              {/* Zip fill + glowing head */}
              <motion.div
                className="absolute left-[15px] top-0 w-[2px] rounded-full"
                style={{
                  height: lineHeight,
                  background:
                    "linear-gradient(to bottom, #D4A830, #926C15)",
                }}
              >
                {/* Glowing zipper pull */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 h-4 w-4 rounded-full bg-[#926C15] ring-2 ring-background opacity-0"
                  animate={{
                    boxShadow: [
                      "0 0 6px 2px rgba(146,108,21,0.4)",
                      "0 0 14px 4px rgba(146,108,21,0.7)",
                      "0 0 6px 2px rgba(146,108,21,0.4)",
                    ],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>

              {/* Step buttons */}
              <div className="relative z-10 flex flex-col">
                {steps.map((step, i) => {
                  const isActive = activeStep === i;
                  const isPast = activeStep > i;
                  return (
                    <button
                      key={step.number}
                      onClick={() => scrollToStep(i)}
                      className="flex items-start gap-4 py-6 text-left group"
                    >
                      {/* 3D raised circle tab */}
                      <div
                        className={cn(
                          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                          isActive ? "scale-110" : "scale-100"
                        )}
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(145deg, #E8C44A 0%, #B88A18 50%, #7A5A10 100%)",
                                boxShadow:
                                  "0 5px 0 #4a3506, 0 8px 20px rgba(146,108,21,0.45), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.2)",
                                color: "#fff",
                              }
                            : isPast
                            ? {
                                background: "linear-gradient(145deg, rgba(212,168,48,0.35), rgba(122,90,16,0.2))",
                                boxShadow:
                                  "0 3px 0 rgba(74,53,6,0.5), 0 5px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
                                border: "1.5px solid rgba(146,108,21,0.5)",
                                color: "#926C15",
                              }
                            : {
                                background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted)))",
                                boxShadow:
                                  "0 3px 0 rgba(0,0,0,0.15), 0 5px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
                                border: "1.5px solid hsl(var(--border))",
                                color: "hsl(var(--muted-foreground))",
                              }
                        }
                      >
                        <span className="text-[11px] font-black">{i + 1}</span>
                      </div>

                      {/* Text */}
                      <div className="pt-1 flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-wider mb-0.5 transition-colors duration-300",
                            isActive || isPast
                              ? "text-[#926C15]"
                              : "text-muted-foreground/40"
                          )}
                        >
                          {step.label}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-bold leading-tight transition-colors duration-300",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {step.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-tight">
                          {step.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Right: iPad Pro device frame ── */}
            <div className="flex items-stretch min-h-0">
              {/* iPad Pro frame — flat aluminum edges, tight uniform bezels */}
              <div className="relative w-full h-full flex flex-col rounded-[1.1rem] bg-[#1c1c1e] px-[10px] pt-[5px] pb-[5px]
                shadow-[0_32px_80px_rgba(0,0,0,0.38),0_0_0_1px_rgba(255,255,255,0.08),inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                {/* Top bezel — FaceTime camera centered (landscape iPad Pro) */}
                <div className="shrink-0 flex items-center justify-center h-3">
                  <div className="h-[4px] w-[4px] rounded-full bg-[#2e2e2e] ring-1 ring-black/40" />
                </div>
                {/* Screen — stretches to fill remaining device height */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-[0.45rem] flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{ duration: 0.38, ease }}
                      className="w-full h-full flex flex-col bg-card"
                    >
                      {/* Screenshot — takes 2/3 of available screen height */}
                      <div className="relative flex-[2] min-h-0 overflow-hidden bg-muted">
                        <motion.div
                          className="w-full"
                          animate={{ y: ["0%", "-62%"] }}
                          transition={{
                            duration: 10,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                            repeatDelay: 0.8,
                          }}
                        >
                          <Image
                            src={steps[activeStep].image}
                            alt={steps[activeStep].title}
                            width={1400}
                            height={1050}
                            className="w-full h-auto block"
                            sizes="(max-width: 768px) 100vw, 840px"
                          />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#926C15]/40 bg-black/40 px-3 py-1 text-[11px] font-semibold text-[#D4A830] backdrop-blur-sm">
                            {steps[activeStep].number} · {steps[activeStep].label}
                          </span>
                        </div>
                      </div>

                      {/* Content — takes 1/3 of available screen height */}
                      <div className="flex-[1] min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden">
                        {/* Left: description */}
                        <div className="px-4 py-3">
                          <h3 className="mb-1.5 text-sm font-black tracking-tight">
                            {steps[activeStep].title}
                          </h3>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {steps[activeStep].description}
                          </p>
                        </div>

                        {/* Right: outcomes */}
                        <div className="px-4 py-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#926C15]">
                            What you get
                          </p>
                          <ul className="space-y-1.5">
                            {steps[activeStep].outcomes.map((outcome, i) => (
                              <motion.li
                                key={outcome}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.08 + i * 0.06, ease }}
                                className="flex items-start gap-2 text-xs text-muted-foreground"
                              >
                                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#926C15]" />
                                {outcome}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Bottom bezel — home indicator pill (iPad Pro, no home button) */}
                <div className="shrink-0 flex items-center justify-center h-3">
                  <div className="h-[3px] w-7 rounded-full bg-[#2e2e2e]" />
                </div>
                {/* Volume buttons — RIGHT side (iPad Pro, top two buttons) */}
                <div className="absolute -right-[3px] top-[18%] h-6 w-[3px] rounded-r-full bg-[#141414] shadow-[-1px_0_2px_rgba(0,0,0,0.5)]" />
                <div className="absolute -right-[3px] top-[28%] h-8 w-[3px] rounded-r-full bg-[#141414] shadow-[-1px_0_2px_rgba(0,0,0,0.5)]" />
                {/* Power / Touch ID button — RIGHT side, below volume */}
                <div className="absolute -right-[3px] top-[44%] h-10 w-[3px] rounded-r-full bg-[#141414] shadow-[-1px_0_2px_rgba(0,0,0,0.5)]" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Mobile accordion ───────────────────────────────────────────── */

function MobileSection() {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef(null);

  return (
    <div ref={ref} className="py-16 px-4 space-y-3">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">
          How Mirror Works
        </p>
        <h2 className="text-4xl font-black tracking-tight">The Mirror Way.</h2>
        <p className="mt-2 text-base text-muted-foreground">
          Four connected steps. One closed loop.
        </p>
      </div>

      {steps.map((step, i) => {
        const isOpen = open === i;
        return (
          <div
            key={step.number}
            className={cn(
              "overflow-hidden rounded-2xl border transition-colors duration-300",
              isOpen ? "border-[#926C15]/35" : "border-border"
            )}
          >
            <button
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black text-[#926C15]">
                  {step.number}
                </span>
                <div>
                  <p className="text-[10px] font-bold text-[#926C15]/70 uppercase tracking-wide">
                    {step.label}
                  </p>
                  <p className="text-sm font-bold">{step.title}</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border">
                    <div className="relative h-64 bg-muted overflow-hidden">
                      <motion.div
                        className="w-full"
                        animate={{ y: ["0%", "-62%"] }}
                        transition={{
                          duration: 10,
                          repeat: Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut",
                          repeatDelay: 0.8,
                        }}
                      >
                        <Image
                          src={step.image}
                          alt={step.title}
                          width={1400}
                          height={1050}
                          className="w-full h-auto block"
                          sizes="100vw"
                        />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      <div>
                        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#926C15]">
                          What you get
                        </p>
                        <ul className="space-y-2">
                          {step.outcomes.map((o) => (
                            <li key={o} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#926C15]" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Export ─────────────────────────────────────────────────────── */

export function HowMirrorWorks() {
  return (
    <>
      <div className="hidden md:block">
        <DesktopSection />
      </div>
      <div className="md:hidden">
        <MobileSection />
      </div>
    </>
  );
}
