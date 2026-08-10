'use client'

// src/app/program/_components/program-hero.tsx
//
// Same picture, gradients, glow, grain, and layout as the homepage hero
// (src/components/layout/sections/hero.tsx / the intel.mirror.education
// pattern) — only the copy differs, since this page speaks to a specific
// program (Uganda UNEB) rather than the platform.

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useInView } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.11, ease },
  }),
}

const PILLS = [
  'Available 24/7',
  'Repeat exams until mastery',
  'Registered UNEB candidate',
  'Hear back in 3 hours',
]

export function ProgramHero() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="relative w-full overflow-hidden min-h-[92vh] flex items-center">
      {/* Background photo — same graduation image as the homepage hero */}
      <div className="absolute inset-0">
        <Image
          src="/assets/images/graduand.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/35" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full bg-[#926C15]/25 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-52 pb-14 w-full">
        <motion.a
          href="/schools"
          custom={0}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={fadeUp}
          className="group mb-3 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
        >
          <span className="text-[#D4AA30]">Enrolling now:</span>{' '}
          <span className="text-white">Uganda · Kenya · Rwanda</span>
          <ArrowRight className="h-3.5 w-3.5 text-white transition-transform duration-300 group-hover:translate-x-1" />
        </motion.a>

        <div className="gap-8 lg:flex lg:items-end lg:justify-between">
          <div className="mb-8 text-left lg:mb-0">
            <motion.h1
              custom={1}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              variants={fadeUp}
              className="max-w-xl text-balance text-5xl font-black tracking-tighter leading-[1.03] text-white sm:text-6xl lg:text-7xl"
            >
              The school that guarantees results.
            </motion.h1>
          </div>

          <div className="max-w-sm text-left">
            <motion.div
              custom={2}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              variants={fadeUp}
              className="mb-6 flex flex-wrap gap-2"
            >
              {PILLS.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/25 bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-white"
                >
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.div
              custom={3}
              initial="hidden"
              animate={inView ? 'show' : 'hidden'}
              variants={fadeUp}
              className="flex flex-row flex-wrap items-center gap-3"
            >
              <Link
                href="/schools"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-[#926C15] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/30 transition-all duration-300 hover:bg-[#7A5A10] hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
              >
                Find your school
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#included"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/25 hover:-translate-y-1 active:translate-y-0"
              >
                Details
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
