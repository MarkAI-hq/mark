"use client";

import { Marquee } from "@devnomic/marquee";
import "@devnomic/marquee/dist/index.css";
import Image from "next/image";
import React from "react";

interface Sponsor {
  logo: string;
  name: string;
}

const sponsors: Sponsor[] = [
  { logo: "/images/unacuall.jpg", name: "UNACU" },
  { logo: "/images/pctechall.jpg", name: "PCTech Magazine" },
  { logo: "/images/hopechannelall.png", name: "Hope Channel" },
];

const SponsorMarquee: React.FC = () => {
  return (
    <div className="relative w-full flex justify-center py-12 pb-15">
      <div className="w-[60%] overflow-hidden bg-background">
        <h3 className="mb-6 text-center text-3xl font-semibold">As Seen in</h3>
        <Marquee className="gap-[4rem] [--duration:25s]">
          {sponsors.map((sponsor) => (
            <div key={sponsor.name} className="flex items-center">
              <Image
                src={sponsor.logo}
                alt={`Logo of ${sponsor.name}`}
                width={120}
                height={60}
                className="object-contain flex-shrink-0"
              />
              <span className="ml-4 text-lg font-medium whitespace-nowrap">
                {sponsor.name}
              </span>
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
};

export default SponsorMarquee;