'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast }  from 'sonner'

const formSchema = z
  .object({
    newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path:    ['confirmPassword'],
    message: 'Passwords do not match',
  })

export default function ResetPasswordForm() {
  const form         = useForm<z.infer<typeof formSchema>>({
    resolver:      zodResolver(formSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token = searchParams.get('token')

    if (!token) {
      toast.error('Invalid reset link', { description: 'No token found. Please request a new reset link.' })
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ newPassword: values.newPassword, token }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        const description = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || 'Something went wrong. Please try again.'
        toast.error('Reset failed', { description })
        return
      }

      toast.success('Password reset successful', {
        description: 'You can now sign in with your new password.',
      })
      router.push('/login')
    } catch {
      toast.error('Network error', { description: 'Unable to connect. Please try again later.' })
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-background">

      {/* Top nav */}
      <div className="absolute top-6 left-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#926C15] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>

      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#926C15]/15 border border-[#926C15]/25">
            <Sparkles className="h-4 w-4 text-[#926C15]" />
          </div>
          <span className="font-bold text-foreground">Mirror Intelligence</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
            Set new password.
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Card */}
        <div>
          <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-[#926C15] via-[#C09020] to-[#D4AA30]" />
          <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* New password */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNew ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showNew
                              ? <EyeOff className="h-4 w-4" />
                              : <Eye    className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Repeat your password"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirm
                              ? <EyeOff className="h-4 w-4" />
                              : <Eye    className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#926C15] hover:bg-[#7A5A10] text-white shadow-lg shadow-[#926C15]/25 mt-2"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>

              </form>
            </Form>
          </div>
        </div>

      </div>
    </div>
  )
}
