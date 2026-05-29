'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: "We cut grading time by 70% in our first term. But the real discovery was seeing that 83% of our History students were making the same Precision Error — something we'd never have found without Mirror.",
    name: 'Margaret',
    initials: 'MA',
    role: 'Head of Department, History',
    school: 'Brookhouse School, Nairobi',
  },
  {
    quote: "Mirror told me three weeks before our national exams exactly which students needed urgent intervention. Two of them passed with distinction. Without Mirror, they wouldn't have made it.",
    name: 'Joseph',
    initials: 'JO',
    role: 'Senior Teacher',
    school: 'Waterford Kamhlaba, Eswatini',
  },
  {
    quote: "Tracy answered a question about Bloom's taxonomy application at 11pm while I was preparing lessons. That alone changed how I use the platform.",
    name: 'Rebecca',
    initials: 'RN',
    role: 'Science Teacher',
    school: 'Grange School, Lagos',
  },
  {
    quote: "Our school average went from 61% to 74% in one academic year. Parents noticed. Enrolment went up. Mirror changed how we teach, not just how we grade.",
    name: 'Patrick',
    initials: 'PB',
    role: 'Head Teacher',
    school: 'Crawford International, Cape Town',
  },
  {
    quote: "Every teacher here was skeptical. Three weeks in, our HoD Biology said she'd never grade manually again. Mirror shows you things about your students you didn't know you were missing.",
    name: 'Amara',
    initials: 'AD',
    role: 'Academic Director',
    school: 'American International School, Accra',
  },
  {
    quote: "The cognitive profiles Mirror builds for each student are extraordinary. I now know that each learner has a distinct reasoning pattern. That's not a grading tool — that's intelligence.",
    name: 'Tariq',
    initials: 'TH',
    role: 'Senior Lecturer',
    school: 'Aga Khan Academy, Mombasa',
  },
]

const SCHOOLS = [
  'Brookhouse School, Nairobi',
  'Grange School, Lagos',
  'Waterford Kamhlaba, Eswatini',
  'Crawford International, Cape Town',
  'Aga Khan Academy, Mombasa',
  'British School, Cairo',
  'American International School, Accra',
  'Northside College, Johannesburg',
]

const STATS = [
  { value: '2,400+', label: 'Assessments graded this week' },
  { value: '97%',    label: 'Grading accuracy' },
  { value: '14 hrs', label: 'Saved per teacher / month' },
]

export function RegisterLeftPanel() {
  const [index, setIndex]     = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % TESTIMONIALS.length)
        setVisible(true)
      }, 450)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const t = TESTIMONIALS[index]

  return (
    <div className="hidden lg:flex flex-col relative overflow-hidden bg-[#0D0B08] px-12 py-10 text-white">

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .testimonial-fade {
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .testimonial-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .testimonial-hidden {
          opacity: 0;
          transform: translateY(10px);
        }
      `}</style>

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
      {/* Gold atmospheric glows */}
      <div className="pointer-events-none absolute -left-20 top-1/3 h-[600px] w-[600px] rounded-full bg-[#926C15]/14 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[350px] w-[350px] rounded-full bg-[#926C15]/8 blur-[100px]" />

      {/* Logo */}
      <div className="relative z-10 mb-10">
        <Link href="/">
          <Image
            src="/assets/images/markBlackBg.png"
            alt="Mirror Intelligence"
            width={160}
            height={80}
            className="rounded-lg"
          />
        </Link>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex gap-3 mb-10">
        {STATS.map(({ value, label }) => (
          <div
            key={value}
            className="flex-1 rounded-xl bg-white/5 border border-white/8 px-4 py-3"
          >
            <p className="text-xl font-black tracking-tight bg-gradient-to-br from-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
              {value}
            </p>
            <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Rotating testimonial */}
      <div className="relative z-10 mb-10">
        <div
          className={`testimonial-fade rounded-2xl bg-white/5 border border-white/10 p-6 ${
            visible ? 'testimonial-visible' : 'testimonial-hidden'
          }`}
        >
          <span className="block text-5xl font-black leading-none text-[#926C15]/60 mb-3 -mt-1">&ldquo;</span>

          <p className="text-white/85 text-base leading-relaxed font-medium min-h-[96px]">
            {t.quote}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#926C15] to-[#D4AA30] flex items-center justify-center text-xs font-black text-white shrink-0">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">{t.name}</p>
                <p className="text-xs text-white/45 mt-1">{t.role} · {t.school}</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-[#C09020] text-[#C09020]" />
              ))}
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-3 justify-center">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true) }, 450) }}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-[#926C15]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scrolling school strip */}
      <div className="relative z-10 mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
          Trusted by schools across Africa and beyond
        </p>
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee-track flex gap-3 w-max">
            {[...SCHOOLS, ...SCHOOLS].map((school, i) => (
              <span
                key={i}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/55 whitespace-nowrap"
              >
                {school}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-auto text-xs text-white/25">
        © {new Date().getFullYear()} Mirror Intelligence. All rights reserved.
      </p>
    </div>
  )
}
