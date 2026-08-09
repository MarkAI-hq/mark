"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ease = [0.22, 1, 0.36, 1] as const;

const generalFaqs = [
  { q: "Is Founders Academy online or in person?", a: "It's online-first: AI-led academics and mentor sessions happen over video, wherever you live. Students in Kampala, Nairobi and Kigali also get in-person cohort days and mentor meetups at our regional hubs.", value: "g-1" },
  { q: "What does the guarantee actually mean?", a: "Verified business profit, not revenue. Students who complete all four years and don't reach it receive a full tuition refund, subject to program terms.", value: "g-2" },
  { q: "Which certificate do I graduate with?", a: "It depends on where you're enrolled: KCSE in Kenya, UCE in Uganda, or the Rwanda Advanced Level Certificate in Rwanda. The curriculum is mapped to each country's national syllabus, so the certificate is fully recognized at home.", value: "g-3" },
  { q: "What ages and grades does this cover?", a: "Four years, equivalent to secondary/high school. Students start in their country's first year of secondary school.", value: "g-4" },
  { q: "How does AI-accelerated learning work?", a: "Instead of a full day in class, students work through core subjects with an AI tutor at their own pace, mastering each topic before moving on. Most finish academics by early afternoon, freeing the rest of the day for building.", value: "g-5" },
  { q: "Do I need my own laptop and internet?", a: "Students need a laptop or tablet and a stable internet connection for AI-led lessons. Where that's a barrier, we help connect eligible families with subsidized devices and data through local partners.", value: "g-6" },
  { q: "What kind of businesses do students actually build?", a: "Whatever they're motivated to build and can reach profitability on with minimal capital \u2014 resale, services, farm produce, digital products, local delivery. Students keep full ownership.", value: "g-7" },
  { q: "What if I don't have a business idea yet?", a: "Most students don't, and that's fine. Year one is built around rapid idea validation, customer conversations, and mentor-guided experiments until something sticks.", value: "g-8" },
  { q: "What's the mentor situation?", a: "Every student gets a working mentor \u2014 a founder or operator building in their region \u2014 plus regular group sessions with guests from across the Mirror Intelligence network.", value: "g-9" },
  { q: "Can students be removed from the program?", a: "Yes. Students who consistently don't engage, academically or on their business, may be asked to leave. The bar is high, and so is the support, but the guarantee depends on real effort.", value: "g-10" },
  { q: "How do admissions work?", a: "Five steps: online application, an aptitude and English assessment, a business challenge with a short video, a family interview, and placement into a cohort.", value: "g-11" },
  { q: "What if my family can't afford tuition?", a: "We offer needs-based scholarships for strong candidates. Don't let tuition stop you from applying.", value: "g-12" },
];

const familyFaqs = [
  { q: "Will my child get a real, recognized certificate?", a: "Yes \u2014 it's mapped to their country's national curriculum and issued alongside their business results, not instead of them.", value: "f-1" },
  { q: "What if it doesn't work out?", a: "If your child completes all four years without reaching the profit target, you're covered by the guarantee: full tuition refund, subject to program terms.", value: "f-2" },
  { q: "How are students supported day to day?", a: "Mentors, academic coordinators and a regional community lead check in throughout the week. Academics are self-paced but monitored closely \u2014 if a student falls behind, we intervene early.", value: "f-3" },
  { q: "What if my child wants a more traditional path later?", a: "The academic track meets national curriculum requirements throughout, so switching to a conventional school or sitting national exams independently stays an option at any point.", value: "f-4" },
];

function FaqGroup({ items }: { items: typeof generalFaqs }) {
  return (
    <Accordion type="single" collapsible>
      {items.map(({ q, a, value }, i) => (
        <AccordionItem key={value} value={value} className="border-border">
          <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline hover:text-[#926C15] [&[data-state=open]]:text-[#926C15] transition-colors group">
            <span className="flex items-center gap-4">
              <span className="shrink-0 font-mono text-xs font-bold text-[#926C15]/50 group-hover:text-[#926C15] transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>
              {q}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-5 pl-9 text-sm leading-relaxed text-muted-foreground">{a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function FoundersAcademyFaq() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" ref={ref} className="py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-14 text-center space-y-4"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">Questions</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Frequently asked</h2>
        </motion.div>

        <FaqGroup items={generalFaqs} />

        <p className="mb-2 mt-12 text-xs font-bold tracking-[0.2em] text-[#926C15] uppercase">For families</p>
        <FaqGroup items={familyFaqs} />
      </div>
    </section>
  );
}
