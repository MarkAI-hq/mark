import { Metadata } from "next";
import { FoundersAcademyCountryProvider } from "@/components/layout/sections/founders-academy/country-context";
import { FoundersAcademyHero } from "@/components/layout/sections/founders-academy/hero";
import { FoundersAcademyStatsBar } from "@/components/layout/sections/founders-academy/stats-bar";
import { FoundersAcademyModel } from "@/components/layout/sections/founders-academy/model";
import { FoundersAcademyHowItWorks } from "@/components/layout/sections/founders-academy/how-it-works";
import { FoundersAcademyNetwork } from "@/components/layout/sections/founders-academy/network";
import { FoundersAcademyCurriculum } from "@/components/layout/sections/founders-academy/curriculum";
import { FoundersAcademyPath } from "@/components/layout/sections/founders-academy/path";
import { FoundersAcademyGuarantee } from "@/components/layout/sections/founders-academy/guarantee";
import { FoundersAcademyAdmissions } from "@/components/layout/sections/founders-academy/admissions";
import { FoundersAcademyFaq } from "@/components/layout/sections/founders-academy/faq";

export const metadata: Metadata = {
  title: "Founders Academy — Mirror Intelligence",
  description:
    "Africa's AI-powered high school. Students graduate with a national certificate and $3,500 in verified business profit — guaranteed.",
};

export default function FoundersAcademyPage() {
  return (
    <FoundersAcademyCountryProvider>
      <FoundersAcademyHero />
      <FoundersAcademyStatsBar />
      <FoundersAcademyModel />
      <FoundersAcademyHowItWorks />
      <FoundersAcademyNetwork />
      <FoundersAcademyCurriculum />
      <FoundersAcademyPath />
      <FoundersAcademyGuarantee />
      <FoundersAcademyAdmissions />
      <FoundersAcademyFaq />
    </FoundersAcademyCountryProvider>
  );
}
