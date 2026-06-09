import { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, MapPin, BadgeCheck, Search } from 'lucide-react'
import { listPublicSchools } from '@/lib/actions/enrollment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Find a School — Mark',
  description: 'Discover AI-powered schools on the Mark platform. Study free. Pay only for your certificate.',
}

export default async function SchoolsPage() {
  const { data } = await listPublicSchools(1, 50)
  const schools = data?.schools ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            Mark
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/schools/register">Register your school</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Find your school on Mark
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            AI-powered schools where you study for free and pay only when you want a certificate.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {[
              ['Study for free', '✓'],
              ['AI-graded assessments', '✓'],
              ['Verified certificates', '✓'],
            ].map(([label, check]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[#C9A84C] font-bold">{check}</span>
                <span>{label}</span>
              </div>
            ))}
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
                href={`/enroll/${school.school_code}`}
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
                  Enroll free →
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* CTA for schools */}
        <div className="mt-16 rounded-2xl border border-border/50 bg-card p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Run a school for free</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            AI runs your operations. You work 2–4 hours a week. Your school earns ~$15,000/year.
          </p>
          <Button asChild className="mt-4 bg-[#C9A84C] text-white hover:bg-[#A07830]">
            <Link href="/schools/register">Register Your School — Free</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
