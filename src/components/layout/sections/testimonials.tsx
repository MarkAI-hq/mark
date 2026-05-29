"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const schools = [
  "Brookhouse School, Nairobi",
  "Grange School, Lagos",
  "Waterford Kamhlaba, Eswatini",
  "Crawford International, Cape Town",
  "Aga Khan Academy, Mombasa",
  "British School, Cairo",
  "American International School, Accra",
  "Northside College, Johannesburg",
];

const testimonials = [
  {
    quote: "We cut grading time by 70% in our first term. But the real discovery was seeing that 83% of our History students were making the same Precision Error — something we'd never have found without Mirror.",
    name: "Margaret Akello",
    role: "Head of Department, History",
    school: "Brookhouse School, Nairobi",
    size: "lg",
  },
  {
    quote: "Mirror told me three weeks before our national exams exactly which students needed urgent intervention. Two of them passed with distinction. Without Mirror, they wouldn't have made it.",
    name: "Joseph Ochen",
    role: "Senior Teacher",
    school: "Waterford Kamhlaba, Eswatini",
    size: "md",
  },
  {
    quote: "Tracy answered a question about Bloom's taxonomy application at 11pm while I was preparing lessons. That alone changed how I use the platform.",
    name: "Rebecca Nasasira",
    role: "Science Teacher",
    school: "Grange School, Lagos",
    size: "sm",
  },
  {
    quote: "Our school average went from 61% to 74% in one academic year. Parents noticed. Enrolment went up. Mirror changed how we teach, not just how we grade.",
    name: "Dr. Patrick Bwire",
    role: "Head Teacher",
    school: "Crawford International, Cape Town",
    size: "md",
  },
  {
    quote: "Every teacher here was skeptical. Three weeks in, our HoD Biology said she'd never grade manually again. Mirror shows you things about your students you didn't know you were missing.",
    name: "Amara Diallo",
    role: "Academic Director",
    school: "American International School, Accra",
    size: "sm",
  },
  {
    quote: "The cognitive profiles Mirror builds for each student are extraordinary. I now know that each learner has a distinct reasoning pattern. That's not a grading tool — that's intelligence.",
    name: "Dr. Tariq Hassan",
    role: "Senior Lecturer",
    school: "Aga Khan Academy, Mombasa",
    size: "lg",
  },
];

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  school: string;
  size: string;
  delay: number;
  inView: boolean;
}

function TestimonialCard({ quote, name, role, school, delay, inView }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:border-[#926C15]/30 hover:shadow-lg hover:shadow-[#926C15]/5"
    >
      {/* Quote mark */}
      <span className="text-4xl font-black leading-none text-[#926C15]/25 select-none">&ldquo;</span>

      {/* Quote */}
      <p className="flex-1 text-sm leading-relaxed text-foreground">{quote}</p>

      {/* Attribution */}
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#926C15]/10 text-xs font-black text-[#926C15]">
          {name.split(' ')[0].charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{name.split(' ')[0]}</p>
          <p className="text-[11px] text-muted-foreground">{role} · {school}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const col1 = testimonials.filter((_, i) => i % 3 === 0);
  const col2 = testimonials.filter((_, i) => i % 3 === 1);
  const col3 = testimonials.filter((_, i) => i % 3 === 2);

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 bg-muted/10">
      <div className="mx-auto max-w-6xl">

        {/* Schools social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="mb-16 text-center space-y-6"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">
            Trusted by schools across Africa and beyond
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {schools.map((school, i) => (
              <motion.span
                key={school}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05, ease }}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {school}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mb-12 space-y-4"
        >
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Schools that made the decision.
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            In their own words — what Mirror looks like when it's working.
          </p>
        </motion.div>

        {/* Masonry grid — desktop 3 cols, tablet 2, mobile 1 */}
        <div className="hidden lg:grid grid-cols-3 gap-5 items-start">
          <div className="flex flex-col gap-5">
            {col1.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={0.1 + i * 0.1} inView={inView} />
            ))}
          </div>
          <div className="flex flex-col gap-5 mt-8">
            {col2.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={0.2 + i * 0.1} inView={inView} />
            ))}
          </div>
          <div className="flex flex-col gap-5">
            {col3.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={0.3 + i * 0.1} inView={inView} />
            ))}
          </div>
        </div>

        {/* Tablet 2-col */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={0.1 + i * 0.07} inView={inView} />
          ))}
        </div>

        {/* Mobile 1-col */}
        <div className="grid sm:hidden grid-cols-1 gap-4">
          {testimonials.slice(0, 4).map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={0.1 + i * 0.07} inView={inView} />
          ))}
        </div>

      </div>
    </section>
  );
}
