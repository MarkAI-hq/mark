import { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, MapPin, BadgeCheck } from 'lucide-react'
import { listPublicSchools, getPublicSchoolProfile } from '@/lib/actions/enrollment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FLAGSHIP_SCHOOL_CODE } from '@/config/site-domains'

export const metadata: Metadata = {
  title: 'Find your school — Mirror Intelligence',
  description:
    'Mirror Intelligence Online High School is our flagship, live and enrolling today. Private schools are onboarding to run their own school on the same intelligence.',
}

export default async function SchoolsPage() {
  const { data } = await listPublicSchools(1, 50)
  const schools = data?.schools ?? []

  const flagship = schools.find((s) => s.school_code === FLAGSHIP_SCHOOL_CODE) ?? schools[0]
  const otherSchools = flagship ? schools.filter((s) => s.school_code !== flagship.school_code) : []

  const flagshipProfile = flagship ? (await getPublicSchoolProfile(flagship.school_code)).data : null
  const certPrice = flagship?.partner_config?.cert_price_ea_usd ?? flagship?.partner_config?.cert_price_usd

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/20">
      <main className="container mx-auto max-w-5xl px-4 py-12">
        {/* Find your school */}
        <div className="mb-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Start with our flagship school —<br className="hidden sm:block" /> more are onboarding soon.
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Mirror Intelligence Online High School is our own flagship, built and run directly by us,
              live and enrolling today. Private schools are now onboarding to run their own school on the
              same AI — this directory will grow as they join.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Not sure which subjects fit you yet?{' '}
              <Link href="/learning-compass" className="font-medium text-[#C9A84C] underline underline-offset-4">
                Try the free Learning Compass
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-6 lg:justify-end">
            <div className="text-center lg:text-right">
              <p className="text-2xl font-bold text-foreground">{flagship ? 1 : 0}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Flagship live</p>
            </div>
            <div className="text-center lg:text-right">
              <p className="text-2xl font-bold text-foreground">{otherSchools.length}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Also onboarded</p>
            </div>
            {flagshipProfile && flagshipProfile.student_count > 0 && (
              <div className="text-center lg:text-right">
                <p className="text-2xl font-bold text-foreground">{flagshipProfile.student_count}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Students enrolled</p>
              </div>
            )}
          </div>
        </div>

        {/* Flagship school */}
        {flagship ? (
          <Link
            href={`/schools/${flagship.school_code}`}
            className="group mb-6 block rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#FBF5E6] to-background p-7 shadow-sm transition-all hover:border-[#C9A84C]/50 hover:shadow-md dark:from-[#1a1600] dark:to-background sm:p-8"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C9A84C]/10">
                <GraduationCap className="h-6 w-6 text-[#C9A84C]" />
              </div>
              <Badge variant="outline" className="gap-1 text-xs font-semibold text-[#C9A84C] border-[#C9A84C]/40">
                Flagship · Available now
              </Badge>
            </div>
            <p className="mt-4 text-xl font-semibold text-foreground group-hover:text-[#C9A84C] transition-colors">
              {flagship.name}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{flagship.country_code}</span>
              {flagship.education_system && (
                <>
                  <span>·</span>
                  <span>{flagship.education_system}</span>
                </>
              )}
            </div>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Run directly by Mirror Intelligence — the school this whole platform was built to prove out first.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/50 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Admission fee</p>
                <p className="mt-0.5 font-semibold text-foreground">50,000 UGX</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tuition, per term</p>
                <p className="mt-0.5 font-semibold text-foreground">145 USD / 500,000 UGX</p>
              </div>
              {certPrice && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Certificate from</p>
                  <p className="mt-0.5 font-semibold text-foreground">${certPrice}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end">
              <span className="text-sm font-semibold text-[#C9A84C]">Start admissions →</span>
            </div>
          </Link>
        ) : (
          <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
            <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No schools listed yet</p>
          </div>
        )}

        {/* Onboarding banner / other schools */}
        {otherSchools.length === 0 ? (
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-border/60 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#C9A84C]">Coming soon</p>
              <p className="mt-1 font-semibold text-foreground">Private schools are onboarding</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Each will run under its own name, fees, and branding — appearing here the moment they&apos;re verified.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/schools/register">Run a school on Mirror</Link>
            </Button>
          </div>
        ) : (
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherSchools.map((school) => (
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
                    <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200 dark:border-emerald-500/30">
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
