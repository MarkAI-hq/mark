'use client';

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Timeline } from "@/components/ui/timeline";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

interface CardData {
  src: string;
  alt: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface GroupData {
  heading: string;
  subheading: string;
  subtitle: string;
  cards: CardData[];
}

function Card({ card, index }: { card: CardData; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-[#926C15]/35 hover:shadow-lg hover:shadow-[#926C15]/6"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={card.src}
          alt={card.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
        <a href={card.buttonLink} target="_blank" rel="noopener noreferrer">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-[#926C15]/30 text-xs text-[#926C15] transition-all duration-200 hover:bg-[#926C15] hover:text-white hover:border-[#926C15]"
          >
            {card.buttonText}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </a>
      </div>
    </motion.div>
  );
}

export function OurStory() {
  const groups: GroupData[] = [
    {
      heading: "The Problem We're Solving",
      subheading: "The teaching loop is broken everywhere.",
      subtitle: "Teachers grade. Platforms report. But nobody closes the loop — nobody tells you why a student failed, or exactly what to do next.",
      cards: [
        {
          src: "/assets/images/teacheroverloads.jpeg",
          alt: "Teacher Overload",
          description:
            "Teacher Overload: Educators spend more time marking than teaching. Grading a single class set takes hours — leaving no time for the intervention that actually moves scores.",
          buttonText: "See how Mirror helps",
          buttonLink: "/register",
        },
        {
          src: "/assets/images/innovationtrapped.jpg",
          alt: "Grading Without Diagnosis",
          description:
            "Grading Without Diagnosis: A score tells you what happened. Mirror tells you why — the specific thinking error behind every wrong answer, classified and mapped to Bloom's taxonomy so you know exactly what to do next.",
          buttonText: "Learn more",
          buttonLink: "#",
        },
        {
          src: "/assets/images/studentdisengagement.jpg",
          alt: "Students Left Behind",
          description:
            "Students Left Behind: When errors aren't diagnosed, the same gaps compound across every assessment. Students who needed early intervention fall further behind each term.",
          buttonText: "Understand the impact",
          buttonLink: "#",
        },
        {
          src: "/assets/images/aiblackbox.jpg",
          alt: "AI Built on Teaching Science",
          description:
            "AI Built on Teaching Science: Mirror's schema-enriched AI doesn't just process text — it understands student thinking. Every mark is justified against your marking scheme, with the specific cognitive error identified, classified, and mapped. That's pedagogy-first intelligence.",
          buttonText: "Discover Mirror",
          buttonLink: "#",
        },
      ],
    },
  ];

  return (
    <div className="relative w-full overflow-clip">
      <Timeline
        data={groups.map(({ heading, subheading, subtitle, cards }) => ({
          title: heading,
          content: (
            <div>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                {subheading}
              </h2>
              <h3 className="mb-8 text-sm font-medium text-muted-foreground">
                {subtitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {cards.map((card, i) => (
                  <Card key={i} card={card} index={i} />
                ))}
              </div>
            </div>
          ),
        }))}
      />
    </div>
  );
}
