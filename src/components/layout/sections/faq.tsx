"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";

const ease = [0.22, 1, 0.36, 1] as const;

const FAQList = [
  {
    question: "What exactly is Mirror — how would you describe it?",
    answer:
      "Mirror is Teaching Intelligence. It's a closed-loop system that turns every assessment into a full cycle of insight and action — quality-auditing the exam before grading begins, grading with schema-enriched AI, diagnosing root-cause errors by Bloom's taxonomy, generating targeted intervention recommendations, and auto-tracking impact over time. That's not a grading upgrade. It's a fundamentally different relationship between assessment and teaching.",
    value: "item-1",
  },
  {
    question: "Can Mirror grade handwritten student work?",
    answer:
      "Yes. Mirror is built to handle handwritten scripts, scanned PDFs, photos of student papers, and digital submissions. Upload any format and Mirror returns annotated, justified marks against your marking scheme in minutes.",
    value: "item-2",
  },
  {
    question: "What is Bloom's Taxonomy analysis and why does it matter?",
    answer:
      "Bloom's Taxonomy classifies thinking at six levels — from basic recall (Remember) to advanced reasoning (Create, Evaluate, Analyze). Mirror maps every student's errors to the correct cognitive level, so you know whether a student got a question wrong because they forgot a fact or because they can't apply a concept. That distinction changes what you teach next.",
    value: "item-3",
  },
  {
    question: "What are Precision Errors and Omission Errors?",
    answer:
      "These are Mirror's root-cause error categories. A Precision Error means the student understood the concept but expressed it inaccurately. An Omission Error means they left out a required component of the answer. Knowing the error type tells you whether to reteach the concept or improve how students structure their responses.",
    value: "item-4",
  },
  {
    question: "How does Mirror's Teaching Intelligence loop work?",
    answer:
      "Step 1 — Quality Audit: Mirror checks the assessment itself against curriculum before grading. Step 2 — AI Grading: schema-enriched grading with per-error annotations. Step 3 — Diagnosis: root-cause error classification and Bloom's mapping per student. Step 4 — Intervene: individual, group, and class-level intervention recommendations. Step 5 — Impact: delta auto-tracked across assessments so you see what's working.",
    value: "item-5",
  },
  {
    question: "What about data privacy and security?",
    answer:
      "Mirror never trains on your data. Your students' work stays within your school. All submissions are stored on U.S. servers, encrypted in transit and at rest, with audited access. No unsecured third-party access is permitted. For full details, see our Privacy Policy.",
    value: "item-6",
  },
  {
    question: "How quickly will my school see results?",
    answer:
      "Most schools see actionable insights from their first graded assessment — within minutes of upload. Score distributions, error patterns, and students needing intervention are surfaced immediately. Longitudinal impact tracking begins building from your second assessment onward.",
    value: "item-7",
  },
];

export const FAQSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" ref={ref} className="py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center space-y-4"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">FAQ</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Common Questions</h2>
          <p className="text-base text-muted-foreground">
            Everything you need to know about Mirror.
          </p>
        </motion.div>

        {/* Accordion */}
        <Accordion type="single" collapsible>
          {FAQList.map(({ question, answer, value }, i) => (
            <motion.div
              key={value}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05 + i * 0.06, ease }}
            >
              <AccordionItem value={value} className="border-border">
                <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline hover:text-[#926C15] [&[data-state=open]]:text-[#926C15] transition-colors group">
                  <span className="flex items-center gap-4">
                    <span className="shrink-0 font-mono text-xs font-bold text-[#926C15]/50 group-hover:text-[#926C15] transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-9 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
