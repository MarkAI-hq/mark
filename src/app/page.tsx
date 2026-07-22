import { Metadata } from 'next'
import Script from 'next/script'
import { Navbar } from '../components/layout/sections/navbar'
import { HeroSection } from '@/components/layout/sections/hero'
import { StatsBar } from '@/components/layout/sections/stats-bar'
import { OurStory } from '@/components/layout/sections/ourstory'
import { HowMirrorWorks } from '@/components/layout/sections/how-it-works'
import { TracySection } from '@/components/layout/sections/tracy'
import { LearningCompassCtaSection } from '@/components/layout/sections/learning-compass-cta'
import { ValueCalculator } from '@/components/layout/sections/value-calculator'
import { TestimonialsSection } from '@/components/layout/sections/testimonials'
import SponsorsSection from '@/components/layout/sections/sponsors'
import Header from '@/components/layout/sections/header'
import { FAQSection } from '@/components/layout/sections/faq'
import { FooterSection } from '@/components/nav/footer-landing'

export const metadata: Metadata = {
  title: 'Mirror Intelligence',
  description: 'Teaching Intelligence, Learning Intelligence, and School Insights — in one closed-loop platform.',
}

export default function HomePage() {
  return (
    <>
      <Script
        id="cal-embed"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "30min", {origin:"https://app.cal.com"});
Cal.ns["30min"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`,
        }}
      />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <OurStory />
      <HowMirrorWorks />
      <TracySection />
      <LearningCompassCtaSection />
      <ValueCalculator />
      <TestimonialsSection />
      <SponsorsSection />
      <Header />
      <FAQSection />
      <FooterSection />
    </>
  )
}
