'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, GraduationCap, CheckCircle2, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { selfEnroll, getPublicSchoolProfile } from '@/lib/actions/enrollment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function EnrollPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const schoolCode = (params.schoolCode as string)?.toUpperCase()
  const ref = searchParams.get('ref') ?? undefined

  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ name: string; pin: string; schoolName: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    guardian_name: '',
    guardian_phone: '',
  })

  useEffect(() => {
    getPublicSchoolProfile(schoolCode).then(({ data }) => {
      setSchool(data)
      setLoading(false)
    })
  }, [schoolCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('First and last name are required.')
      return
    }
    setSubmitting(true)
    const { data, error } = await selfEnroll({
      school_code: schoolCode,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || undefined,
      guardian_name: form.guardian_name.trim() || undefined,
      guardian_phone: form.guardian_phone.trim() || undefined,
      ref,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setDone({ name: data!.name, pin: data!.pin, schoolName: data!.school_name })
  }

  function copyPin() {
    if (!done) return
    navigator.clipboard.writeText(done.pin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!school) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">School not found</p>
        <p className="text-sm text-muted-foreground">
          The school code <span className="font-mono">{schoolCode}</span> doesn&apos;t match any
          publicly listed school.
        </p>
        <Button asChild variant="outline">
          <Link href="/schools">Browse Schools</Link>
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-surface-raised/30 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-card p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Welcome, {done.name.split(' ')[0]}!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re now enrolled at <strong>{done.schoolName}</strong>.
          </p>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
            <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              Save your PIN — you&apos;ll need it to log in
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                {done.pin}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={copyPin}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => router.push('/student/login')}
          >
            Go to Student Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight text-foreground">
            Mark
          </Link>
          {school.is_verified && (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
              Verified School
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-12">
        {/* School card */}
        <div className="mb-8 rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/10">
              <GraduationCap className="h-5 w-5 text-[#C9A84C]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{school.name}</p>
              <p className="text-xs text-muted-foreground">
                {school.country_code}
                {school.education_system ? ` · ${school.education_system}` : ''}
              </p>
            </div>
          </div>
          {ref && (
            <p className="mt-3 rounded-lg bg-surface-raised/50 px-3 py-2 text-xs text-muted-foreground">
              You were invited by a friend. Both of you are on the path to a free exam!
            </p>
          )}
        </div>

        {/* Enroll form */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-foreground">Create your account</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Studying is free. You only pay when you want a certificate.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="guardian_name">
                  Guardian name <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="guardian_name"
                  placeholder="Parent / Guardian"
                  value={form.guardian_name}
                  onChange={(e) => setForm((f) => ({ ...f, guardian_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guardian_phone">
                  Guardian phone <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="guardian_phone"
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={form.guardian_phone}
                  onChange={(e) => setForm((f) => ({ ...f, guardian_phone: e.target.value }))}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-[#C9A84C] text-white hover:bg-[#A07830]"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll for Free
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By enrolling you agree to Mark&apos;s{' '}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
