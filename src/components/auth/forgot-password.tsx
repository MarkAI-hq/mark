'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast }  from 'sonner'

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
})

export default function ForgotPasswordForm() {
  const router = useRouter()
  const form   = useForm<z.infer<typeof formSchema>>({
    resolver:      zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })

      if (res.ok) {
        toast.success('Reset link sent', {
          description: 'Check your inbox — the link expires in 1 hour.',
        })
        setTimeout(() => router.push('/login'), 2000)
      } else {
        const errorData = await res.json()
        toast.error('Request failed', {
          description: errorData.message || 'Something went wrong. Please try again.',
        })
      }
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
            Forgot password?
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div>
          <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-[#926C15] via-[#C09020] to-[#D4AA30]" />
          <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@school.edu" {...field} />
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
                  {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>

              </form>
            </Form>
          </div>
        </div>

      </div>
    </div>
  )
}
