"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Send, ChevronRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const conversation = [
  {
    role: "teacher",
    text: "Which students in Form 4B need attention before exams?",
    delay: 0.6,
  },
  {
    role: "tracy",
    text: "3 students need immediate attention. Birungi Dorcus has a 29% average with recurring Precision Errors across 3 submissions. I've prepared individual coaching plans — want me to assign them?",
    delay: 1.5,
  },
  {
    role: "teacher",
    text: "Yes. What's driving the class's Precision Errors?",
    delay: 2.7,
  },
  {
    role: "tracy",
    text: "83% of Form 4B's errors are Precision Errors — students understand concepts but express them imprecisely. It's a language-of-discipline gap, not a knowledge gap. I can generate a structured response framework for the next 3 assessments.",
    delay: 3.6,
  },
];

const capabilities = [
  "Knows every student's cognitive profile",
  "Diagnoses class-wide error patterns instantly",
  "Generates intervention plans automatically",
  "Predicts which students will struggle next",
  "Answers any curriculum or pedagogy question",
  "Works at 2am when you're still marking",
];

export function TracySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-24 sm:py-32 px-4 bg-background">
      {/* Subtle background shift */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_50%,hsl(42_75%_33%/0.04),transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease }}
            className="space-y-6 order-2 lg:order-1"
          >
            <p className="text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">
              Meet Tracy
            </p>

            <h2 className="text-4xl font-black tracking-tight leading-[1.06] sm:text-5xl">
              The teacher who knows everything
              <span className="bg-gradient-to-br from-[#926C15] via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
                {" "}about your school.
              </span>
            </h2>

            <p className="text-base leading-relaxed text-muted-foreground">
              Tracy is Mirror&apos;s AI teaching intelligence — trained on curriculum, pedagogy,
              and your school&apos;s live performance data. She already knows every student,
              every error pattern, every class.
            </p>

            <p className="text-base leading-relaxed text-muted-foreground">
              No onboarding. No manual. No learning curve. The moment you open Mirror,
              Tracy is ready. Most teachers call her their most useful colleague
              within the first week.
            </p>

            <ul className="space-y-2.5 pt-1">
              {capabilities.map((cap, i) => (
                <motion.li
                  key={cap}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.07, ease }}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#926C15]" />
                  {cap}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right — chat UI */}
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.75, delay: 0.12, ease }}
            className="order-1 lg:order-2"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
              {/* Title bar */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#926C15]">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Tracy</p>
                    <p className="text-[11px] text-muted-foreground">Mirror Teaching Intelligence</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-4 p-5 min-h-[300px] bg-muted/20">
                {conversation.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.45, delay: msg.delay, ease }}
                    className={`flex gap-2.5 ${msg.role === "teacher" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "tracy" && (
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#926C15]">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "teacher"
                        ? "bg-foreground/8 text-muted-foreground"
                        : "bg-card border border-border text-foreground shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
                  <span className="flex-1 text-xs text-muted-foreground/50">
                    Ask Tracy anything about your school...
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#926C15]">
                    <Send className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
