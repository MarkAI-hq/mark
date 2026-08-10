// src/app/(auth)/accept-invitation/page.tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Loader2, MailCheck, XCircle, Eye, EyeOff,
  ArrowRight, ShieldCheck, BookOpen, BarChart2, CheckCircle2, Chrome,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { peekInvitation, acceptInvitation, registerInvited } from '@/lib/actions/auth'

// ── Types ──────────────────────────────────────────────────────────────────
type PageStatus = 'validating' | 'form' | 'sso' | 'existing-user' | 'success' | 'error'

interface InvitationMeta {
  email:            string
  organizationName: string
  requiresSignup:   boolean
  ssoRequired:      boolean
  token:            string
}

// ── Schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  firstName:       z.string().min(2, 'At least 2 characters'),
  lastName:        z.string().min(2, 'At least 2 characters'),
  password:        z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  phone:           z.string().optional(),
  acceptTerms:     z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path:    ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const FEATURES = [
  {
    icon:  ShieldCheck,
    title: 'Your classes, your way',
    desc:  'Access and manage your assigned classes and learner profiles.',
  },
  {
    icon:  BookOpen,
    title: 'Full assessment control',
    desc:  'Create exams, assessments and marking guides with complete access.',
  },
  {
    icon:  BarChart2,
    title: 'Learner insights',
    desc:  'View student performance and analytics across your classes.',
  },
]

// ── Page ───────────────────────────────────────────────────────────────────
export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [pageStatus, setPageStatus] = useState<PageStatus>('validating')
  const [statusMsg,  setStatusMsg]  = useState('Validating your invitation…')
  const [meta,       setMeta]       = useState<InvitationMeta | null>(null)
  const [showPw,     setShowPw]     = useState(false)
  const [showCpw,    setShowCpw]    = useState(false)
  const [isPending,  start]         = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', password: '',
      confirmPassword: '', phone: '', acceptTerms: false,
    },
  })

  // ── Step 1: peek at invitation metadata ───────────────────────────────
  useEffect(() => {
    if (!token) {
      setStatusMsg('No invitation token found. Please check your link.')
      setPageStatus('error')
      return
    }

    const validate = async () => {
      const { data, error } = await peekInvitation(token)

      if (error) {
        setStatusMsg(error.message)
        setPageStatus('error')
        toast.error('Invitation Failed', { description: error.message })
        return
      }

      if (!data) return

      setMeta({
        email:            data.email,
        organizationName: data.organizationName,
        requiresSignup:   data.requiresSignup,
        ssoRequired:      data.ssoRequired,
        token,
      })

      if (data.ssoRequired) {
        // SSO-enforced org → show "Accept with Google" button
        setPageStatus('sso')
      } else if (data.requiresSignup) {
        // New user → show registration form
        setPageStatus('form')
      } else {
        // Existing user → accept directly then redirect to login
        setPageStatus('existing-user')
        const result = await acceptInvitation(token)
        if (result.error) {
          setStatusMsg(result.error.message)
          setPageStatus('error')
          toast.error('Failed', { description: result.error.message })
          return
        }
        setStatusMsg(`You've been added to ${data.organizationName}. Please log in.`)
        setPageStatus('success')
        toast.success('Welcome aboard!')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    validate()
  }, [token, router])

  // ── Step 2: register new user ─────────────────────────────────────────
  const onSubmit = (values: FormData) => {
    start(async () => {
      const { data, error } = await registerInvited({
        token,
        firstName:   values.firstName,
        lastName:    values.lastName,
        email:       meta?.email ?? '',
        password:    values.password,
        phone:       values.phone || undefined,
        acceptTerms: values.acceptTerms,
      })

      if (error) {
        toast.error('Registration failed', { description: error.message })
        return
      }

      setStatusMsg(data?.message ?? 'Account created! Please verify your email before logging in.')
      setPageStatus('success')
    })
  }

  // ── Left panel ─────────────────────────────────────────────────────────
  const leftPanelCopy = meta
    ? `Complete your account to join ${meta.organizationName}.`
    : `Your account is being set up. Here's what you'll have access to as a teacher.`

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* Left */}
      <div className="hidden lg:flex flex-col gap-8 bg-slate-900 p-16 text-white">
        <Link href="/">
          <Image
            src="/assets/images/markBlackBg.png"
            alt="Mark logo"
            width={200}
            height={100}
            className="rounded-lg"
          />
        </Link>

        <div className="space-y-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight">
              You&apos;ve been invited<br />to join your institution.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              {leftPanelCopy}
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} MarkAI Labs, Inc. All rights reserved.
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-col justify-center items-center px-8 py-16 sm:px-16 lg:px-24 bg-slate-50">

        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden self-start">
          <Link href="/">
            <Image src="/assets/images/markBlackBg.png" alt="Mark logo" width={28} height={28} className="rounded-lg" />
          </Link>
        </div>

        {/* ── SSO-enforced invitation ── */}
        {pageStatus === 'sso' && meta && (
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Accept Invitation</h2>
              <p className="text-sm text-slate-500">
                Joining <span className="font-semibold text-slate-700">{meta.organizationName}</span> as a Teacher
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium">Google Workspace required</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Your school requires all staff to sign in with Google. Password login is disabled.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5">
              <MailCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600 truncate">{meta.email}</span>
              <span className="ml-auto text-xs text-slate-400 shrink-0">Invited</span>
            </div>

            <Link
              href={`/api/auth/google?invite_token=${encodeURIComponent(meta.token)}&return_url=/dashboard/teacher`}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Chrome className="h-4 w-4" />
              Accept with Google
            </Link>
          </div>
        )}

        {/* ── Validating / processing / error / success ── */}
        {(pageStatus === 'validating' || pageStatus === 'existing-user' || pageStatus === 'error' || pageStatus === 'success') && (
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10 space-y-8">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Accept Invitation</h2>
              <p className="text-sm text-slate-500">{statusMsg}</p>
            </div>

            <div className="flex justify-center items-center h-24">
              {(pageStatus === 'validating' || pageStatus === 'existing-user') && (
                <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
              )}
              {pageStatus === 'success' && (
                <MailCheck className="h-14 w-14 text-green-500" />
              )}
              {pageStatus === 'error' && (
                <XCircle className="h-14 w-14 text-red-400" />
              )}
            </div>

            {pageStatus === 'success' && (
              <div className="text-center space-y-1">
                <p className="text-sm text-slate-500">
                  Check your inbox and verify your email before logging in.
                </p>
                <Link href="/login" className="text-sm font-medium text-slate-900 hover:underline block">
                  Go to login →
                </Link>
              </div>
            )}

            {pageStatus === 'error' && (
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Contact your administrator to resend the invitation.
                </p>
                <Link href="/login" className="text-sm font-medium text-slate-900 hover:underline block">
                  Back to login
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Registration form ── */}
        {pageStatus === 'form' && meta && (
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10 space-y-6">

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Complete your account</h2>
              <p className="text-sm text-slate-500">
                Joining <span className="font-semibold text-slate-700">{meta.organizationName}</span> as a Teacher
              </p>
            </div>

            {/* Locked email */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5">
              <MailCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600 truncate">{meta.email}</span>
              <span className="ml-auto text-xs text-slate-400 shrink-0">Invited</span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars" className="pr-9" {...field} />
                          <button type="button" tabIndex={-1} onClick={() => setShowPw(p => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showCpw ? 'text' : 'password'} placeholder="Repeat" className="pr-9" {...field} />
                          <button type="button" tabIndex={-1} onClick={() => setShowCpw(p => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Phone */}
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone
                      <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+256 700 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Terms */}
                <FormField control={form.control} name="acceptTerms" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-2.5">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                      </FormControl>
                      <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                        I agree to the{' '}
                        <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-primary">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-primary">Privacy Policy</Link>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <ArrowRight className="mr-2 h-4 w-4" />
                  }
                  {isPending ? 'Creating account…' : 'Complete Registration'}
                </Button>

              </form>
            </Form>

          </div>
        )}

      </div>
    </div>
  )
}