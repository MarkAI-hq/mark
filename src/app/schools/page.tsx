import { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, MapPin, BadgeCheck, ArrowRight, ClipboardCheck } from 'lucide-react'
import { listPublicSchools } from '@/lib/actions/enrollment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Find your school — Mirror Intelligence',
  description:
    'The school that adapts to the learner, not the other way round. One-on-one AI tutoring, adapted to each learner — UNEB O & A Level, Uganda · Kenya · Rwanda.',
}

export default async function SchoolsPage() {
  const { data } = await listPublicSchools(1, 50)
  const schools = data?.schools ?? []

  const primarySchoolCode = schools[0]?.school_code

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/20">
      <main className="container mx-auto max-w-5xl px-4 py-12">
        {/* Hero — run a school */}
        <div className="mb-12 rounded-3xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#FBF5E6] to-background p-8 text-center dark:from-[#1a1600] dark:to-background sm:p-14">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A84C]/10">
            <GraduationCap className="h-7 w-7 text-[#C9A84C]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Run a school for free
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            AI runs your operations. You work 2–4 hours a week. Your school earns ~$15,000/year.
          </p>
          <Button asChild size="lg" className="mt-6 bg-[#C9A84C] text-white hover:bg-[#A07830]">
            <Link href="/schools/register">Register Your School — Free</Link>
          </Button>
        </div>

        {/* Secondary — find your school */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Find your Mirror school
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            The school that adapts to the learner, not the other way round — a Personalized Learning
            Assistant, one-on-one, priced so every learner can have it.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {[
              ['Available 24/7', '✓'],
              ['Repeat exams until mastery', '✓'],
              ['Registered UNEB candidate', '✓'],
            ].map(([label, check]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[#C9A84C] font-bold">{check}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {primarySchoolCode && (
              <Button asChild size="lg" className="gap-2 bg-[#C9A84C] text-white hover:bg-[#A07830]">
                <Link href={`/schools/${primarySchoolCode}/apply`}>
                  <ClipboardCheck className="h-4 w-4" />
                  Start Admissions
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="/program">
                See how it works
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Schools grid */}
        {schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
            <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No schools listed yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first — register your school for free.
            </p>
            <Button asChild className="mt-4 bg-[#C9A84C] text-white hover:bg-[#A07830]">
              <Link href="/schools/register">Register School</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <Link
                key={school.organization_id}
                href={`/schools/${school.school_code}`}
                className="group block rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-[#C9A84C]/40 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10">
                    <GraduationCap className="h-5 w-5 text-[#C9A84C]" />
                  </div>
                  {school.is_verified && (
                    <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-foreground group-hover:text-[#C9A84C] transition-colors">
                  {school.name}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{school.country_code}</span>
                  {school.education_system && (
                    <>
                      <span>·</span>
                      <span className="truncate">{school.education_system}</span>
                    </>
                  )}
                </div>
                {(school.partner_config?.cert_price_usd || school.partner_config?.cert_price_ea_usd) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Certificate from{' '}
                    <span className="font-medium text-foreground">
                      ${school.partner_config.cert_price_ea_usd ?? school.partner_config.cert_price_usd}
                    </span>
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-[#C9A84C]">
                  Apply now →
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
