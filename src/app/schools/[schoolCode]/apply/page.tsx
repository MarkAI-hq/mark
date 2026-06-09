'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { applyToSchool } from '@/lib/actions/admissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const EDUCATION_LEVELS = [
  'Primary / Junior Secondary',
  'O-Level / GCSE',
  'A-Level / Advanced Secondary',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Vocational / Technical',
  'Adult Learner',
]

const COUNTRIES = [
  'Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Nigeria', 'Ghana',
  'South Africa', 'Zimbabwe', 'UK', 'USA', 'Australia', 'Other',
]

type Step = 1 | 2 | 3

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  education_level: string
  motivation: string
  goals: string
}

const EMPTY: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  country: '',
  education_level: '',
  motivation: '',
  goals: '',
}

export default function ApplyPage() {
  const params = useParams<{ schoolCode: string }>()
  const router = useRouter()
  const schoolCode = params.schoolCode

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  function update(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function canProceed(): boolean {
    if (step === 1)
      return !!(form.first_name.trim() && form.last_name.trim() && form.email.trim())
    if (step === 2)
      return !!(form.education_level && form.motivation.trim())
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    const { data, error } = await applyToSchool({
      school_code: schoolCode,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      country: form.country || undefined,
      education_level: form.education_level || undefined,
      motivation: form.motivation.trim() || undefined,
      goals: form.goals.trim() || undefined,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setApplicationId(data!.application_id)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-surface-raised/20 px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Application submitted!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ll hear back within 24 hours. Check your email for updates.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Application ID: <span className="font-mono text-foreground">{applicationId}</span>
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="bg-[#C9A84C] text-white hover:bg-[#A07830]">
              <Link href="/schools">Explore other schools</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/student/login">Already have an account? Log in</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { n: 1, label: 'Personal details' },
    { n: 2, label: 'School fit' },
    { n: 3, label: 'Confirm' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/20">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            href={`/schools/${schoolCode}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to school
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C9A84C]">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Apply to {schoolCode.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-xl px-4 py-10">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  n === step
                    ? 'bg-[#C9A84C] text-white'
                    : n < step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {n < step ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span
                className={`hidden text-xs sm:block ${
                  n === step ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {n < 3 && (
                <div className="mx-1 h-px w-8 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Personal details</h2>
                <p className="mt-1 text-sm text-muted-foreground">Basic information about you.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First name *</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => update('first_name', e.target.value)}
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last name *</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => update('last_name', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+256 700 000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">School fit</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us about your academic background and goals.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="education_level">Current education level *</Label>
                <select
                  id="education_level"
                  value={form.education_level}
                  onChange={(e) => update('education_level', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select level</option>
                  {EDUCATION_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="motivation">Why do you want to study here? *</Label>
                <Textarea
                  id="motivation"
                  value={form.motivation}
                  onChange={(e) => update('motivation', e.target.value)}
                  placeholder="Tell us what motivated you to apply and what you hope to achieve..."
                  rows={4}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {form.motivation.length}/2000
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goals">Academic or career goals (optional)</Label>
                <Textarea
                  id="goals"
                  value={form.goals}
                  onChange={(e) => update('goals', e.target.value)}
                  placeholder="Describe your short and long-term goals..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Confirm your application</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review your details before submitting.
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{form.first_name} {form.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{form.email}</p>
                  </div>
                  {form.country && (
                    <div>
                      <p className="text-xs text-muted-foreground">Country</p>
                      <p className="font-medium">{form.country}</p>
                    </div>
                  )}
                  {form.education_level && (
                    <div>
                      <p className="text-xs text-muted-foreground">Education level</p>
                      <p className="font-medium">{form.education_level}</p>
                    </div>
                  )}
                </div>
                {form.motivation && (
                  <div>
                    <p className="text-xs text-muted-foreground">Motivation</p>
                    <p className="text-sm line-clamp-3">{form.motivation}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                By submitting, you confirm that the information above is accurate. The school will review your application and respond within 24 hours.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={loading}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canProceed()}
                className="gap-1.5 bg-[#C9A84C] text-white hover:bg-[#A07830]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-1.5 bg-[#C9A84C] text-white hover:bg-[#A07830]"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
