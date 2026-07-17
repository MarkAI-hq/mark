'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, GraduationCap, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { registerSchool } from '@/lib/actions/enrollment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const EDUCATION_SYSTEMS = [
  'Uganda Certificate of Education (UCE)',
  'Uganda Advanced Certificate of Education (UACE)',
  'Kenya Certificate of Secondary Education (KCSE)',
  'Kenya Certificate of Primary Education (KCPE)',
  'Cambridge IGCSE',
  'Cambridge A-Level',
  'National Curriculum (Nigeria)',
  'WAEC',
  'Other',
]

const COUNTRIES = [
  { code: 'UG', name: 'Uganda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'OTHER', name: 'Other' },
]

export default function RegisterSchoolPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    school_name: '',
    country_code: '',
    education_system: '',
    director_first_name: '',
    director_last_name: '',
    director_email: '',
    director_password: '',
    phone: '',
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.school_name || !form.country_code || !form.director_email || !form.director_password) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (form.director_password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    const { data, error } = await registerSchool({
      school_name: form.school_name,
      country_code: form.country_code,
      education_system: form.education_system || undefined,
      director_first_name: form.director_first_name,
      director_last_name: form.director_last_name,
      director_email: form.director_email,
      director_password: form.director_password,
      phone: form.phone || undefined,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-surface-raised/30 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-card p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {form.school_name} registered!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check <strong>{form.director_email}</strong> to verify your account. Mark will
            verify your school within 24 hours.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Once verified, you can start enrolling students — completely free.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/30">
      <main className="container mx-auto max-w-xl px-4 py-12">
        {/* Value prop */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9A84C]/10">
            <GraduationCap className="h-6 w-6 text-[#C9A84C]" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Register your school</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            100% free. AI runs operations. You work 2–4 hours a week.
          </p>
        </div>

        {/* Value stats */}
        <div className="mb-8 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'School cost', value: '$0/month' },
            { label: 'AI grading', value: 'Automated' },
            { label: 'School revenue', value: '~$15K/yr' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/40 bg-card p-3">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="school_name">
                School name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="school_name"
                placeholder="Greenwood Academy"
                value={form.school_name}
                onChange={set('school_name')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country <span className="text-destructive">*</span></Label>
                <Select
                  value={form.country_code}
                  onValueChange={(v) => setForm((f) => ({ ...f, country_code: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Education system</Label>
                <Select
                  value={form.education_system}
                  onValueChange={(v) => setForm((f) => ({ ...f, education_system: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_SYSTEMS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <p className="mb-3 text-sm font-medium text-foreground">Director / Principal</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="director_first_name">First name</Label>
                  <Input
                    id="director_first_name"
                    placeholder="John"
                    value={form.director_first_name}
                    onChange={set('director_first_name')}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="director_last_name">Last name</Label>
                  <Input
                    id="director_last_name"
                    placeholder="Smith"
                    value={form.director_last_name}
                    onChange={set('director_last_name')}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="director_email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="director_email"
                type="email"
                placeholder="john@greenwood.edu"
                value={form.director_email}
                onChange={set('director_email')}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="director_password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="director_password"
                type="password"
                placeholder="At least 8 characters"
                value={form.director_password}
                onChange={set('director_password')}
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-[#C9A84C] text-white hover:bg-[#A07830]"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register School — Free
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
