'use client';

import { useId } from "react";
import React from "react";

export function FeaturesSection() {
  return (
    <div className="py-15 px-5 lg:py-30">
      <h2 className="text-4xl md:text-5xl text-center font-bold mb-4 py-10 text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text">
        Transformative Benefits
      </h2>
      <p className="text-xl text-center text-neutral-700 dark:text-neutral-300 mb-12 max-w-3xl mx-auto">
        Unlock Potential for Everyone in Your Learning Community.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-14 md:gap-7 max-w-6xl mx-auto ">
        {grid.map((feature) => (
          <div
            key={feature.title}
            className="relative bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white p-6 rounded-3xl overflow-hidden"
          >
            <Grid size={20} />
            <p className="text-base font-bold text-neutral-800 dark:text-white relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-900 dark:text-neutral-400 mt-4 text-base font-normal relative z-20">
              {feature.description}
            </p>
            {feature.applications && (
              <ul className="list-decimal list-inside mt-4 text-neutral-600 dark:text-neutral-400 relative z-20 space-y-1">
                {feature.applications.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = [
  {
    title: "For Students:",
    description:
      "Mark AI handles both digital and handwritten assignments at all levels of learning in minutes.",
    applications: [
                  " Truly Personalized Learning: Experience education tailored precisely to their unique needs, learning styles, and pace.", 
                  " Deeper Understanding: Get personalized learning methods based on our proprietary technology on diagnosing student cognitive abilities and thinking errors.", 
                  " Enhanced Engagement: Stay motivated with relevant, challenging, and supportive learning paths.",
                  "Achieve More: Measurably improve outcomes and build lasting knowledge."
                  ],
  },
  {
    title: "For Educators and Institutions:",
    description:
      "Drastically reduce the burden of differentiation. Provide expert pedagogy and student insights.",
    applications: [
      "Scale True Personalization: Implement individualized learning across your school or district, moving beyond generic content delivery.",
      "Empower Your Teachers: Automate assessments in seconds so teachers have more time for the classroom. MarkAI provides powerful, data-driven insights into student needs, addressing critical learning gaps affecting the way of learning.",
      "Integrate Best Practices: Seamlessly incorporate cutting-edge teaching methodologies and research-backed approaches into your curriculum.",
      "Data-Driven Pedagogical Insights: Gain unprecedented analytics on what pedagogical strategies work best for which learners, driving continuous improvement."
    ],
  },
];

interface GridProps {
  pattern?: number[][];
  size?: number;
}

export const Grid: React.FC<GridProps> = ({ pattern, size }) => {
  const [p, setP] = React.useState<number[][]>(() => {
    return Array(5)
      .fill(0)
      .map(() => [
        Math.floor(Math.random() * 4) + 7,
        Math.floor(Math.random() * 6) + 1,
      ]);
  });

  React.useMemo(() => {
    if (pattern) setP(pattern);
  }, [pattern]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x={-12}
          y={4}
          squares={p}
          className="absolute inset-0 h-full w-full mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10"
        />
      </div>
    </div>
  );
};

interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
  width: number;
  height: number;
  x: number;
  y: number;
  squares: number[][];
}

export function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: GridPatternProps) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(([xVal, yVal], i) => (
          <rect
            key={i}
            width={width + 1}
            height={height + 1}
            x={xVal * width}
            y={yVal * height}
            strokeWidth="0"
          />
        ))}
      </svg>
    </svg>
  );
}
