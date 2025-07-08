'use client';

import React from "react";
import { Timeline } from "@/components/ui/timeline";
import Image from "next/image";
import { Button } from "@/components/ui/button";

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

function Card({ card }: { card: CardData }) {
  return (
    <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] md:h-80 lg:h-80">
      <Image
        src={card.src}
        alt={card.alt}
        fill
        className="object-cover"
      />
      <div className="absolute bottom-0 w-full h-2/2 bg-white bg-opacity-60 backdrop-blur-md p-6 dark:bg-neutral-900 dark:bg-opacity-60">
        <p className="text-sm text-neutral-900 dark:text-neutral-200">{card.description}</p>
        <a href={card.buttonLink} target="_blank" rel="noopener noreferrer">
          <Button variant="default" className="mt-4 flex items-center gap-2">
            {card.buttonText}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </a>
      </div>
    </div>
  );
}

export function OurStory() {
  const groups: GroupData[] = [
    {
      heading: "The Problem We're Solving",
      subheading: "The One-Size-Fits-All Challenge.",
      subtitle: "Education strives for personalization, yet struggles to deliver it at scale.",
      cards: [
        {
          src: "/assets/images/teacheroverloads.jpeg",
          alt: "Teacher Overload",
          description:
            "Teacher Overload: Educators are burdened with differentiation, constantly adapting for diverse needs without sufficient tools or time.",
          buttonText: "Solve Challenge",
          buttonLink: "/signup",
        },
        {
          src: "/assets/images/innovationtrapped.jpg",
          alt: "Innovation Trapped",
          description:
            "Innovation Trapped: Groundbreaking pedagogical approaches often remain confined to research papers or individual classrooms, unable to scale their impact.",
          buttonText: "Read More",
          buttonLink: "#",
        },
        {
          src: "/assets/images/studentdisengagement.jpg",
          alt: "Student Disengagement",
          description:
            "Student Disengagement: Generic curricula leave too many students feeling unseen, unchallenged, or left behind.",
          buttonText: "Understand the Impact",
          buttonLink: "#",
        },
        {
          src: "/assets/images/aiblackbox.jpg",
          alt: "AI's Missing Link",
          description:
            'AI\'s Missing Link: Current EdTech AI often acts as a "black box," lacking the transparent, expert-driven pedagogical intelligence needed for true adaptive learning.',
          buttonText: "Discover the Solution",
          buttonLink: "#",
        },
      ],
    },
    {
      heading: "How Mark AI Works",
      subheading: "Mark AI: Where Expert Pedagogy Meets Adaptive AI.",
      subtitle: "We're creating an Ecosystem of Pedagogy and the Engine of Personalized Learning. Here's how it transforms learning:",
      cards: [
        {
          src: "/assets/images/experts.jpg",
          alt: "Mechanism One",
          description:
            "Expert Educators as Architects: Leading teachers, curriculum designers, and learning scientists contribute their unique pedagogical frameworks, learning pathways, and diagnostic strategies directly to Mark AI.",
          buttonText: "Join our team",
          buttonLink: "mailto:info@xrefracted.com?subject=Join Mark AI",
        },
        {
          src: "/assets/images/pkgraph.png",
          alt: "Mechanism Two",
          description:
            "Mark IPOS: Our advanced AI processes expert input, constructing a dynamic, interconnected brain that understands concepts, how best they're taught, what misconceptions arise, and how to adapt instruction.",
          buttonText: "Learn About PKG",
          buttonLink: "mailto:info@xrefracted.com?subject=Mark AI PKG Demo",
        },
        {
          src: "/assets/images/dark.webp",
          alt: "Mechanism Three",
          description:
            "Dynamic, Personalized Learning Journeys: Leverage Mark IPOS and real-time student data, to dynamically generate a unique adaptive learning path for each student.",
          buttonText: "Get a Demo",
          buttonLink: "mailto:info@xrefracted.com?subject=Mark AI PKG Demo",
        },
        {
          src: "/assets/images/assessments.jpg",
          alt: "Mechanism Four",
          description:
            "Intelligent Assessment & Feedback: Our robust assessment capabilities provide deep diagnostic insights to continuously refine learning pathways.",
          buttonText: "Start for free",
          buttonLink: "/signup",
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
              <h2 className="mb-3 text-xl font-bold text-neutral-900 dark:text-neutral-300">
                {subheading}
              </h2>
              <h3 className="mb-8 text-md font-semibold text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cards.map((card, i) => (
                  <Card key={i} card={card} />
                ))}
              </div>
            </div>
          ),
        }))}
      />
    </div>
  );
}
