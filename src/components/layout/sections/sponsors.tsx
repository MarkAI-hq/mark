"use client";

import Image from "next/image";
import { Marquee } from "@devnomic/marquee";
import "@devnomic/marquee/dist/index.css";

interface Sponsor {
  logo: string;
  name: string;
}

const sponsors: Sponsor[] = [
  // { logo: "/assets/images/fsbadge.png", name: "FS6" },
  { logo: "/assets/images/unacuall.jpg", name: "UNACU" },
  { logo: "/assets/images/pctechall.jpg", name: "PCTech Magazine" },
  { logo: "/assets/images/hopechannelall.png", name: "Hope Channel" },
];

export default function SponsorMarquee() {
  return (
    <div className="w-3/3 flex justify-center py-12 pb-15 mx-auto px-20">
      <div className="overflow-hidden bg-background text-center">
        <h3 className="mb-6 text-center text-3xl font-semibold">Featured on</h3>
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
