// src/components/auth/invitation-accept-shell.tsx
//
// Shared shell for /accept-invitation (teacher) and /accept-guardian-invitation
// (guardian) — the two pages differ only in which backend actions they call,
// their left-panel copy/highlights, and whether SSO applies. Everything else
// (token parsing, the validate→form/sso/existing-user→success state machine,
// the registration form itself) is identical and lives here once, so a future
// fix to this surface only needs to touch one file.
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import {
  Loader2, MailCheck, XCircle, Eye, EyeOff,
  ArrowRight, ArrowLeft, Chrome, Sparkles, type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'

// ── Shared schema ────────────────────────────────────────────────────────────
export const invitationAcceptSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type InvitationFormData = z.infer<typeof invitationAcceptSchema>

type PageStatus = 'validating' | 'form' | 'sso' | 'existing-user' | 'success' | 'error'

export interface InvitationPeekMeta {
  email: string
  organizationName: string
  requiresSignup: boolean
  ssoRequired?: boolean
}

export interface InvitationAcceptResult {
  message?: string
  accessToken?: string
  refreshToken?: string
  user?: { roles?: string[] }
}

type ActionResponse<T> = Promise<{ data: T | null; error: { message: string } | null }>

export interface InvitationRegisterPayload {
  token: string
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  acceptTerms: boolean
}

export interface InvitationHighlight {
  icon: LucideIcon
  title: string
  desc: string
}

export interface InvitationAcceptConfig {
  // ── data ──
  peekInvitation: (token: string) => ActionResponse<InvitationPeekMeta>
  acceptExisting: (token: string) => ActionResponse<InvitationAcceptResult>
  registerNew: (payload: InvitationRegisterPayload) => ActionResponse<InvitationAcceptResult>

  // ── behavior ──
  supportsSso: boolean
  ssoReturnUrl?: string
  resolveRedirect: (user?: { roles?: string[] }) => string

  // ── copy ──
  badgeLabel: string
  heroHeadingLead: string
  heroHeadingHighlight: string
  heroCopy: (meta: InvitationPeekMeta | null) => string
  highlights: InvitationHighlight[]
  invitationTitle: string
  roleSuffix?: (meta: InvitationPeekMeta) => string
  formHeading: string
  existingUserSuccessMessage: (organizationName: string) => string
  existingUserSuccessToast: string
  registerSuccessToast: string
  errorHelpCopy: string
}

export function InvitationAcceptShell({ config }: { config: InvitationAcceptConfig }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [pageStatus, setPageStatus] = useState<PageStatus>('validating')
  const [statusMsg, setStatusMsg] = useState('Validating your invitation…')
  const [meta, setMeta] = useState<InvitationPeekMeta | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [isPending, start] = useTransition()

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationAcceptSchema),
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
      const { data, error } = await config.peekInvitation(token)

      if (error) {
        setStatusMsg(error.message)
        setPageStatus('error')
        toast.error('Invitation Failed', { description: error.message })
        return
      }
      if (!data) return

      setMeta(data)

      if (config.supportsSso && data.ssoRequired) {
        setPageStatus('sso')
      } else if (data.requiresSignup) {
        setPageStatus('form')
      } else {
        setPageStatus('existing-user')
        const result = await config.acceptExisting(token)
        if (result.error) {
          setStatusMsg(result.error.message)
          setPageStatus('error')
          toast.error('Failed', { description: result.error.message })
          return
        }
        setStatusMsg(config.existingUserSuccessMessage(data.organizationName))
        setPageStatus('success')
        toast.success(config.existingUserSuccessToast)
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    validate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router])

  // ── Step 2: register new user ─────────────────────────────────────────
  const onSubmit = (values: InvitationFormData) => {
    start(async () => {
      const { data, error } = await config.registerNew({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        email: meta?.email ?? '',
        password: values.password,
        phone: values.phone || undefined,
        acceptTerms: values.acceptTerms,
      })

      if (error) {
        toast.error('Registration failed', { description: error.message })
        return
      }

      if (data?.accessToken) {
        // Already logged in — cookies were set by the server action.
        toast.success(config.registerSuccessToast)
        router.push(config.resolveRedirect(data.user))
        return
      }

      setStatusMsg(data?.message ?? 'Account created! Please log in.')
      setPageStatus('success')
    })
  }

  const leftPanelCopy = config.heroCopy(meta)
  const roleSuffix = meta && config.roleSuffix ? config.roleSuffix(meta) : ''

  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-2">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-[#0D0B08] px-12 py-10 text-white">

        {/* Film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
          }}
        />
        {/* Gold atmospheric glows */}
        <div className="pointer-events-none absolute left-1/3 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-gold/18 blur-[130px]" />
        <div className="pointer-events-none absolute right-0 bottom-1/3 h-[300px] w-[400px] rounded-full bg-gold/10 blur-[100px]" />

        <div className="relative z-10 space-y-8">
          <Link href="/">
            <Image
              src="/assets/images/markBlackBg.png"
              alt="Mirror Intelligence"
              width={160}
              height={80}
              className="rounded-lg"
            />
          </Link>

          <div className="space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-sm w-fit">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span className="font-semibold text-gold">Mirror</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 font-medium">{config.badgeLabel}</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-3xl font-black leading-tight tracking-tighter">
                {config.heroHeadingLead}{' '}
                <span className="bg-gradient-to-br from-gold via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
                  {config.heroHeadingHighlight}
                </span>
              </h1>
              <p className="text-white/50 text-base leading-relaxed max-w-sm">
                {leftPanelCopy}
              </p>
            </div>

            <div className="space-y-4">
              {config.highlights.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 border border-gold/25">
                    <Icon className="h-3.5 w-3.5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 mt-auto pt-10 text-xs text-white/30">
          © {new Date().getFullYear()} Mirror Intelligence. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center h-full overflow-y-auto px-6 py-12 sm:px-10 bg-background">

        {/* Top navigation */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <div className="flex items-center gap-2.5 lg:hidden">
            <Link href="/">
              <Image src="/assets/images/markBlackBg.png" alt="Mirror Intelligence" width={28} height={28} className="rounded-lg" />
            </Link>
          </div>
        </div>

        {/* ── SSO-enforced invitation ── */}
        {config.supportsSso && pageStatus === 'sso' && meta && (
          <div className="w-full max-w-sm">
            <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-gold via-[#C09020] to-[#D4AA30]" />
            <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tighter text-foreground">{config.invitationTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  Joining <span className="font-semibold text-foreground">{meta.organizationName}</span>{roleSuffix}
                </p>
              </div>

              <div className="rounded-lg border border-gold/30 bg-gold/8 px-4 py-3 text-sm text-foreground">
                <p className="font-medium">Google Workspace required</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your school requires all staff to sign in with Google. Password login is disabled.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
                <MailCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">{meta.email}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">Invited</span>
              </div>

              <Link
                href={`/api/auth/google?invite_token=${encodeURIComponent(token)}&return_url=${config.ssoReturnUrl ?? '/dashboard'}`}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-card border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
              >
                <Chrome className="h-4 w-4" />
                Accept with Google
              </Link>
            </div>
          </div>
        )}

        {/* ── Validating / processing / error / success ── */}
        {(pageStatus === 'validating' || pageStatus === 'existing-user' || pageStatus === 'error' || pageStatus === 'success') && (
          <div className="w-full max-w-sm">
            <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-gold via-[#C09020] to-[#D4AA30]" />
            <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-10 space-y-8">
              <div className="space-y-1.5 text-center">
                <h2 className="text-2xl font-black tracking-tighter text-foreground">{config.invitationTitle}</h2>
                <p className="text-sm text-muted-foreground">{statusMsg}</p>
              </div>

              <div className="flex justify-center items-center h-24">
                {(pageStatus === 'validating' || pageStatus === 'existing-user') && (
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/40" />
                )}
                {pageStatus === 'success' && (
                  <MailCheck className="h-14 w-14 text-green-500" />
                )}
                {pageStatus === 'error' && (
                  <XCircle className="h-14 w-14 text-destructive/70" />
                )}
              </div>

              {pageStatus === 'success' && (
                <div className="text-center space-y-1">
                  <Link href="/login" className="text-sm font-semibold text-gold hover:underline underline-offset-2 block">
                    Go to login →
                  </Link>
                </div>
              )}

              {pageStatus === 'error' && (
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {config.errorHelpCopy}
                  </p>
                  <Link href="/login" className="text-sm font-semibold text-gold hover:underline underline-offset-2 block">
                    Back to login
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Registration form ── */}
        {pageStatus === 'form' && meta && (
          <div className="w-full max-w-sm">

            <div className="mb-6">
              <h1 className="text-2xl font-black tracking-tighter text-foreground leading-tight">
                {config.formHeading}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Joining <span className="font-semibold text-foreground">{meta.organizationName}</span>{roleSuffix}
              </p>
            </div>

            <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-gold via-[#C09020] to-[#D4AA30]" />
            <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-8 space-y-6">

              {/* Locked email */}
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
                <MailCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">{meta.email}</span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">Invited</span>
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
                            <button type="button" tabIndex={-1} onClick={() => setShowPw((p) => !p)}
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
                            <button type="button" tabIndex={-1} onClick={() => setShowCpw((p) => !p)}
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
                          <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-gold">Terms of Service</Link>
                          {' '}and{' '}
                          <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-gold">Privacy Policy</Link>
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
          </div>
        )}

      </div>
    </div>
  )
}
