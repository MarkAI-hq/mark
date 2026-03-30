'use client'

// src/components/auth/signup-form.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, School, ArrowRight, CheckCircle2 } from 'lucide-react'
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
  phone:           z.string().optional(),
  acceptTerms:     z.boolean().refine(v => v === true, { message: 'You must accept the terms' }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path:    ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function SignupForm() {
  const router                = useRouter()
  const [showPw,  setShowPw]  = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [done,    setDone]    = useState(false)
  const [isPending, start]    = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      orgName: '', firstName: '', lastName: '',
      email: '', password: '', confirmPassword: '',
      phone: '', acceptTerms: false,
    },
  })

  const onSubmit = (data: FormData) => {
    start(async () => {
      const { error } = await signUp(
        data.firstName,
        data.lastName,
        data.email,
        data.password,
        data.phone   || undefined,
        undefined,             // photo
        data.acceptTerms,
        data.orgName,          // school name
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
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
          <p className="text-sm text-slate-500 max-w-xs">
            We've sent a verification link to{' '}
            <strong>{form.getValues('email')}</strong>.
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* School name */}
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

        {/* Name */}
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

        {/* Email */}
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

        {/* Passwords */}
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
                      placeholder="Min 8 characters"
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showCpw ? 'text' : 'password'}
                      placeholder="Repeat password"
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

        {/* Phone (optional) */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone Number
                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+256 700 000 000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms */}
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
                  <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-primary">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-primary">
                    Privacy Policy
                  </Link>
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <ArrowRight className="mr-2 h-4 w-4" />
          }
          {isPending ? 'Creating account…' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

      </form>
    </Form>
  )
}