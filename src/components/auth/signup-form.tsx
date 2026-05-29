'use client'

// src/components/auth/signup-form.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, School, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { signUp } from '@/lib/actions/auth'

const schema = z.object({
  orgName:         z.string().min(2, 'School name must be at least 2 characters'),
  firstName:       z.string().min(2, 'First name must be at least 2 characters'),
  lastName:        z.string().min(2, 'Last name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms:     z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path:    ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const STEP1_FIELDS: (keyof FormData)[] = ['orgName', 'firstName', 'lastName']

export function SignupForm() {
  const router               = useRouter()
  const [step, setStep]      = useState(1)
  const [showPw,  setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [done,    setDone]   = useState(false)
  const [isPending, start]   = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      orgName: '', firstName: '', lastName: '',
      email: '', password: '', confirmPassword: '',
      acceptTerms: false,
    },
  })

  const handleNext = async () => {
    const valid = await form.trigger(STEP1_FIELDS)
    if (valid) setStep(2)
  }

  const onSubmit = (data: FormData) => {
    start(async () => {
      const { error } = await signUp(
        data.firstName, data.lastName, data.email, data.password,
        undefined, undefined, data.acceptTerms, data.orgName,
      )

      if (error) {
        toast.error(
          typeof error === 'object' && 'message' in error
            ? (error as any).message
            : 'Registration failed. Please try again.',
        )
        return
      }

      setDone(true)
    })
  }

  // ── Success ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#926C15]/10 border border-[#926C15]/25">
          <CheckCircle2 className="h-7 w-7 text-[#926C15]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            We sent a verification link to{' '}
            <strong className="text-foreground">{form.getValues('email')}</strong>.
            Click it to activate your account.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
          Go to login
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-1 flex-1 rounded-full bg-[#926C15]" />
        <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-[#926C15]' : 'bg-border'}`} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Step 1 ──────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="space-y-0.5 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#926C15]">Step 1 of 2</p>
              <p className="text-sm font-semibold text-foreground">About your school</p>
            </div>

            <FormField
              control={form.control}
              name="orgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-muted-foreground" />
                    School / Organization Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Greenwood Academy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              className="w-full bg-[#926C15] hover:bg-[#7A5A10] text-white shadow-lg shadow-[#926C15]/25"
              size="lg"
              onClick={handleNext}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#926C15] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2 ──────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="space-y-0.5 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#926C15]">Step 2 of 2</p>
              <p className="text-sm font-semibold text-foreground">Your account credentials</p>
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@greenwoodacademy.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPw ? 'text' : 'password'}
                          placeholder="Min 8 chars"
                          className="pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPw(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCpw ? 'text' : 'password'}
                          placeholder="Repeat"
                          className="pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowCpw(p => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2.5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-[#926C15]">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-[#926C15]">
                        Privacy Policy
                      </Link>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-none px-4"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#926C15] hover:bg-[#7A5A10] text-white shadow-lg shadow-[#926C15]/25"
                size="lg"
                disabled={isPending}
              >
                {isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
                  : <><ArrowRight className="mr-2 h-4 w-4" /> Create Account</>
                }
              </Button>
            </div>
          </>
        )}

      </form>
    </Form>
  )
}
