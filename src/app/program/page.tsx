import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Spectral, Work_Sans } from 'next/font/google'
import { ArrowRight, Check, Eye, BellRing, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgramHero } from './_components/program-hero'

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-spectral',
})

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-work-sans',
})

export const metadata: Metadata = {
  title: 'The Program — Mirror Intelligence Online High School',
  description:
    'UNEB O & A Level, adapted to one learner at a time. See how Mirror teaches, what’s included, and what it costs.',
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#9a4b21] dark:text-[#e0935a] sm:text-sm">
      {children}
    </div>
  )
}

function Photo({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" />
    </div>
  )
}

export default function ProgramPage() {
  return (
    <div className={`${spectral.variable} ${workSans.variable} font-[family-name:var(--font-work-sans)]`}>
      <ProgramHero />

      {/* Bloom's Two Sigma Problem */}
      <section className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <Kicker>The problem we exist to solve</Kicker>
          <h2 className="mb-10 font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-5xl">
            Bloom&apos;s Two Sigma Problem
          </h2>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-5 text-lg leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-xl">
                In 1984, educational psychologist Benjamin Bloom compared students in ordinary classrooms
                against students given one-on-one tutoring. The tutored students scored, on average, two
                standard deviations higher — the average tutored student outperformed 98% of the classroom
                group.
              </p>
              <p className="mb-4 text-lg leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-xl">
                He&apos;d found the most effective method of instruction ever measured — and it was
                economically impossible to give every child a private tutor. Our Personalized Learning
                Assistant delivers that same one-on-one instruction, priced so every learner can have it.
              </p>
              <p className="text-sm italic text-[#8a8477] dark:text-[#9d978a]">
                B. S. Bloom, &ldquo;The 2 Sigma Problem,&rdquo; Educational Researcher, 1984
              </p>
            </div>
            <figure className="m-0">
              <Photo src="/assets/images/program/bloom_graph.webp" alt="Bloom 2-sigma effect graph" className="h-72 w-full" />
              <figcaption className="mt-3 text-sm italic text-[#8a8477] dark:text-[#9d978a]">
                The 2 sigma effect: classroom vs. one-on-one tutoring distributions.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Cost vs. saves */}
      <section className="bg-[#1c2b3a] px-6 py-20 sm:px-16 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 text-sm font-bold uppercase tracking-[0.16em] text-[#e8a15c]">
            What this really costs, compared to what it really saves
          </div>
          <p className="text-balance font-[family-name:var(--font-spectral)] text-2xl font-medium leading-[1.3] text-[#faf6ef] sm:text-4xl">
            A repeated S.4 year costs more than three years at this school. A weak UCE result can follow a
            child for a decade. Measured against that,{' '}
            <span className="text-[#e8a15c]">school fees are the smaller number.</span>
          </p>
        </div>
      </section>

      {/* How we teach */}
      <section className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Kicker>How we teach</Kicker>
          <h2 className="mb-4 font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-5xl">
            Every child is taught with care, guided by evidence
          </h2>
          <p className="mb-12 max-w-3xl text-lg leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-xl">
            A lesson on a screen isn&apos;t the same as an education. What matters is whether your child is
            actually learning — so we watch closely, and respond before small gaps become big ones.
          </p>
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
            <Photo src="/assets/images/program/teaching.webp" alt="Mentor with a student" className="h-64 w-full lg:h-80" />
            {[
              {
                n: '01',
                icon: RotateCcw,
                title: 'We catch forgetting before it happens',
                body: 'Each concept is brought back for review at just the right moment — before it fades, not after.',
              },
              {
                n: '02',
                icon: Eye,
                title: 'We notice when a child is struggling',
                body: 'When a student stalls or gets confused, a mentor is alerted and steps in right away.',
              },
              {
                n: '03',
                icon: BellRing,
                title: 'Every lesson follows the science of learning',
                body: 'Spaced revision, active recall, structured note-taking, and hands-on practice — used consistently, in every subject.',
              },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <div className="mb-3 font-[family-name:var(--font-spectral)] text-3xl font-semibold text-[#c98a4a] dark:text-[#d99b5c]">
                  {n}
                </div>
                <div className="mb-2.5 text-xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea]">{title}</div>
                <div className="text-base leading-relaxed text-[#5a5347] dark:text-[#a39f92]">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section id="included" className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <Kicker>What&apos;s included</Kicker>
          <h2 className="mb-12 font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-5xl">
            Everything your child needs, nothing they don&apos;t
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {[
              {
                tag: 'Signature',
                title: 'A Personalized Learning Assistant',
                body: "The best teacher in the world, for one learner, 24/7 — Bloom's 1-on-1 result at school-fee prices.",
              },
              {
                tag: 'Hardware',
                title: 'Lease-to-own laptop',
                body: 'Worth $200 / 700,000 UGX, financed across the half-payment plan at no extra interest.',
              },
              {
                tag: 'Resources',
                title: 'Free digital library & ebooks',
                body: 'A growing shelf of reference and revision resources, at no extra cost.',
              },
              {
                tag: 'Assessment',
                title: 'Repeat exams until mastery',
                body: 'Sit practice and mock exams as many times as it takes to truly know the material.',
              },
              {
                tag: 'Enrollment & Exams',
                title: 'Real UNEB candidate, UCE & UACE',
                body: 'We handle official registration; finals are sat at accredited partner schools, on record.',
              },
              {
                tag: 'Support & Wellbeing',
                title: 'Mentorship, office hours & coaching',
                body: '1-on-1 career guidance, weekly tutor office hours, and clinical psychologist coaching for every student.',
              },
            ].map(({ tag, title, body }) => (
              <div key={tag} className="border-t-[3px] border-[#1c2b3a] pt-3.5 dark:border-[#3a4451]">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#9a4b21] dark:text-[#e0935a]">{tag}</div>
                <div className="mb-2 text-lg font-semibold text-[#1c2b3a] dark:text-[#f5f2ea]">{title}</div>
                <div className="text-base leading-relaxed text-[#5a5347] dark:text-[#a39f92]">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pacing */}
      <section className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <Kicker>Pacing</Kicker>
          <h2 className="mb-4 font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-5xl">
            Learn at your pace, anywhere
          </h2>
          <p className="mb-12 max-w-3xl text-lg leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-xl">
            Two ways to move through the UNEB curriculum — same assistant, same science, different rhythm.
            Some accelerated students finish a full term&apos;s syllabus in as little as 6 weeks; most take
            the standard 3-month route.
          </p>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f2ece0] p-10 dark:bg-[#1c232b]">
              <div className="mb-2 font-[family-name:var(--font-spectral)] text-6xl font-bold leading-none text-[#9a4b21] dark:text-[#e0935a]">
                6 wks
              </div>
              <div className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#1c2b3a] dark:text-[#f5f2ea]">
                Accelerated
              </div>
              <div className="text-lg leading-relaxed text-[#5a5347] dark:text-[#a39f92]">
                For students ready to move quickly, with daily focus and a compressed timeline to
                exam-readiness.
              </div>
            </div>
            <div className="rounded-2xl bg-[#f2ece0] p-10 dark:bg-[#1c232b]">
              <div className="mb-2 font-[family-name:var(--font-spectral)] text-6xl font-bold leading-none text-[#9a4b21] dark:text-[#e0935a]">
                3 months
              </div>
              <div className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#1c2b3a] dark:text-[#f5f2ea]">
                Standard
              </div>
              <div className="text-lg leading-relaxed text-[#5a5347] dark:text-[#a39f92]">
                The steady route — a fuller runway to build mastery at a comfortable, sustainable pace.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it's worth */}
      <section className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <Kicker>What it&apos;s really worth</Kicker>
          <h2 className="mb-10 font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-5xl">
            Everything included, laid out plainly
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-base sm:text-lg">
              <thead>
                <tr className="border-b-[3px] border-[#1c2b3a] dark:border-[#3a4451]">
                  <th className="px-2 py-4 text-left font-semibold text-[#1c2b3a] dark:text-[#f5f2ea]">What you get</th>
                  <th className="px-2 py-4 text-right font-semibold text-[#1c2b3a] dark:text-[#f5f2ea]">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Personalized AI Learning Assistant — 24/7, all year', 'Core curriculum', true],
                  ['Teaching that adapts daily to how your child is actually learning', 'Core curriculum', true],
                  ['UCE / UACE exams sat at partner schools', 'Core curriculum', true],
                  ['Repeat exams until mastery, no extra charge', 'Included', false],
                  ['Free digital library & ebooks', 'Included', false],
                  ['Weekly office hours with a real tutor', 'Included', false],
                  ['1-on-1 career guidance & mentorship', 'Included', false],
                  ['Free coaching with a clinical psychologist', 'Included', false],
                  ['Free holiday program & extra classes (Learning How to Learn, Human Behaviour)', 'Included', false],
                  ['Lease-to-own laptop (worth $200 / 700,000 UGX)', 'Financed on half-plan', false],
                ].map(([item, status, emphasize], i, arr) => (
                  <tr key={item as string} className={i < arr.length - 1 ? 'border-b border-[#e3ddd0] dark:border-white/10' : ''}>
                    <td className="px-2 py-3.5 text-[#3a3f45] dark:text-[#b8bcc2]">{item}</td>
                    <td
                      className={`px-2 py-3.5 text-right font-semibold ${
                        emphasize ? 'text-[#9a4b21] dark:text-[#e0935a]' : 'text-[#5a5347] dark:text-[#a39f92]'
                      }`}
                    >
                      {status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Investment */}
      <section className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto grid max-w-5xl items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-[#1c2b3a] p-10 text-[#faf6ef]">
              <div className="mb-6 text-sm font-bold uppercase tracking-[0.14em] text-[#d8a878]">
                Your investment, per term
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-1.5 text-xs uppercase tracking-[0.06em] text-[#b9c0c9]">
                    Admission fee
                  </div>
                  <div className="font-[family-name:var(--font-spectral)] text-3xl font-semibold sm:text-4xl">
                    50,000 UGX
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs uppercase tracking-[0.06em] text-[#b9c0c9]">
                    Tuition, per term
                  </div>
                  <div className="font-[family-name:var(--font-spectral)] text-2xl font-semibold leading-tight sm:text-3xl">
                    145 USD
                    <br />
                    500,000 UGX
                  </div>
                </div>
              </div>
            </div>
            <p className="text-base leading-relaxed text-[#5a5347] dark:text-[#a39f92] sm:text-lg">
              Pay in full, or in two halves — the half-payment plan finances a lease-to-own laptop at no
              extra interest. Because every learner gets true 1-on-1 mentor attention, each intake is capped
              at 40 students per partner-school center.
            </p>
          </div>
          <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-[#f2ece0] p-10 dark:bg-[#1c232b]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-16 select-none font-[family-name:var(--font-spectral)] text-[220px] font-bold leading-none text-[#e3d4b8] dark:text-white/[0.06] sm:text-[300px]"
            >
              6
            </div>
            <div className="relative z-10">
              <div className="mb-5 font-[family-name:var(--font-spectral)] text-2xl font-semibold text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-3xl">
                The 6-Week Improvement Guarantee
              </div>
              <p className="mb-4 max-w-md text-base leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-lg">
                If your child&apos;s mock score hasn&apos;t improved by at least one full grade band within
                6 weeks — measured against the same diagnostic we run at enrollment — you choose: keep
                studying free for the rest of the year, or take a full refund.
              </p>
              <p className="mb-4 max-w-md text-base leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-lg">
                We&apos;re putting our own tuition on the line, because we can already see —
                interaction by interaction — whether it&apos;s working.
              </p>
              <p className="mb-6 text-sm italic text-[#8a8477] dark:text-[#9d978a]">
                Applies to enrolled students who complete the standard 6-week assessment cycle. Ask
                admissions for full terms.
              </p>
              <Button asChild size="lg" className="gap-2 bg-[#9a4b21] text-white hover:bg-[#7a3a19]">
                <Link href="/schools">
                  Find your school
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How to start */}
      <section className="bg-[#fbf8f2] px-6 py-20 dark:bg-[#12181e] sm:px-12 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Kicker>Before you apply</Kicker>
              <h2 className="mb-7 font-[family-name:var(--font-spectral)] text-3xl font-semibold leading-tight text-[#1c2b3a] dark:text-[#f5f2ea] sm:text-5xl">
                What you need to start
              </h2>
              <ul className="flex flex-col gap-5 text-lg leading-relaxed text-[#3a3f45] dark:text-[#b8bcc2] sm:text-xl">
                {[
                  'A laptop — or join the lease-to-own plan and pay it off across the year',
                  'Reliable internet access',
                  'A weekly time set aside for mentor check-ins',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3.5">
                    <Check className="mt-1 h-5 w-5 shrink-0 text-[#9a4b21] dark:text-[#e0935a]" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Photo src="/assets/images/program/community.webp" alt="Students and community at Mirror" className="h-72 w-full lg:h-96" />
          </div>

          <div className="mb-6 text-sm font-bold uppercase tracking-[0.16em] text-[#9a4b21] dark:text-[#e0935a]">
            From admission to first class
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {[
              { n: '01', title: 'Pay admission', body: 'Hear back from our team within 3 hours of payment.' },
              {
                n: '02',
                title: 'Get your Mirror Campus link',
                body: 'Your guide to how to study, the rules, and the routine — like starting at any school.',
              },
              {
                n: '03',
                title: 'Begin with your assistant',
                body: 'Start learning immediately, at the pace and program you chose.',
              },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <div className="mb-3 font-[family-name:var(--font-spectral)] text-2xl font-semibold text-[#c98a4a] dark:text-[#d99b5c]">
                  {n}
                </div>
                <div className="mb-2 text-xl font-semibold text-[#1c2b3a] dark:text-[#f5f2ea]">{title}</div>
                <div className="text-base leading-relaxed text-[#5a5347] dark:text-[#a39f92]">{body}</div>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <Button asChild size="lg" className="gap-2 bg-[#9a4b21] text-white hover:bg-[#7a3a19]">
              <Link href="/schools">
                Find your school
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA — replaces the deck's contact/footer slide with a live apply flow */}
      <section className="bg-[#1c2b3a] px-6 py-20 text-center sm:px-12 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 font-[family-name:var(--font-spectral)] text-3xl font-semibold text-[#faf6ef] sm:text-4xl">
            Cohorts are limited. Apply early.
          </h2>
          <p className="mb-8 text-lg text-[#c5cad1]">
            UNEB O &amp; A Level, adapted to one learner at a time. Uganda.
          </p>
          <Button asChild size="lg" className="gap-2 bg-[#9a4b21] text-white hover:bg-[#7a3a19]">
            <Link href="/schools">
              Find your school
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-[#c5cad1]">
            Not ready to apply?{' '}
            <Link href="/learning-compass" className="font-medium text-[#faf6ef] underline underline-offset-4">
              Try the free Learning Compass
            </Link>{' '}
            first.
          </p>
        </div>
      </section>
    </div>
  )
}
