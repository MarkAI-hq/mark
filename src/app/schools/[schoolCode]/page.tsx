import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  GraduationCap,
  MapPin,
  BadgeCheck,
  Users,
  ArrowRight,
  BookOpen,
  Award,
} from 'lucide-react'
import { getPublicSchoolProfile } from '@/lib/actions/enrollment'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ schoolCode: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolCode } = await params
  const { data } = await getPublicSchoolProfile(schoolCode)
  if (!data) return { title: 'School — Mark' }
  return {
    title: `${data.name} — Mark`,
    description: `Study for free at ${data.name}. AI-powered school on the Mark platform.`,
  }
}

const FIT_LABELS: Record<string, string> = {
  cambridge: 'Cambridge International',
  ib: 'International Baccalaureate',
  uneb: 'UNEB (Uganda)',
  kcse: 'KCSE (Kenya)',
  waec: 'WAEC (West Africa)',
  ncea: 'NCEA (New Zealand)',
}

export default async function SchoolProfilePage({ params }: Props) {
  const { schoolCode } = await params
  const { data: school } = await getPublicSchoolProfile(schoolCode)

  if (!school) notFound()

  const certPrice = school.partner_config?.cert_price_ea_usd
    ?? school.partner_config?.cert_price_usd

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/schools" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← All schools
          </Link>
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            Mark
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        {/* School hero */}
        <div className="mb-8 rounded-2xl border border-border/50 bg-card p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#C9A84C]/10">
              <GraduationCap className="h-7 w-7 text-[#C9A84C]" />
            </div>
            {school.is_verified && (
              <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200 shrink-0">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified School
              </Badge>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-foreground">{school.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{school.country_code}</span>
            </div>
            {school.education_system && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span>{FIT_LABELS[school.education_system] ?? school.education_system}</span>
              </div>
            )}
            {(school as any).student_count > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{(school as any).student_count} students enrolled</span>
              </div>
            )}
          </div>

          {/* Value props */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: BookOpen, label: 'AI-powered learning', sub: 'Study at your pace' },
              { icon: Award, label: `Certificates from $${certPrice ?? 15}`, sub: 'Pay only for proof' },
              { icon: Users, label: 'Free to join', sub: 'No tuition fees' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-xl border border-border/40 bg-muted/30 p-3 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A84C]/10">
                  <Icon className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#FBF5E6] to-background p-8 text-center dark:from-[#1a1600] dark:to-background">
          <h2 className="text-xl font-bold text-foreground">
            Ready to join {school.name}?
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Apply in 5 minutes. Get a response within 24 hours. Study starts the same day you&apos;re approved.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2 bg-[#C9A84C] text-white hover:bg-[#A07830]">
              <Link href={`/schools/${schoolCode}/apply`}>
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href={`/enroll/${schoolCode}`}>
                Already accepted? Enroll directly
              </Link>
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">How it works</h3>
          <ol className="space-y-3">
            {[
              ['Apply', 'Fill in a short form. No fees, no paperwork.'],
              ['Get approved', 'The school reviews your application — usually within 24 hours.'],
              ['Start studying', 'Access AI-powered lessons and assessments immediately.'],
              ['Earn your certificate', "Pass assessments and get a verified certificate. Pay only when you're ready."],
            ].map(([step, desc], i) => (
              <li key={step} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-xs font-bold text-[#C9A84C]">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  )
}
