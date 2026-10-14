// src/components/auth/students-login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'

import { toast } from '@/hooks/use-toast'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { studentLogin } from '@/lib/actions/student-auth'
import { PinResetDialog } from '@/components/auth/pin-reset-dialog'

const formSchema = z.object({
  school_code:       z.string().min(1, { message: 'School code is required.' }),
  student_school_id: z.string().min(1, { message: 'Student ID is required.' }),
  pin:               z.string().min(4, { message: 'PIN must be at least 4 digits.' }).max(10),
})

export function StudentLoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const returnUrl    = searchParams.get('return_url') || '/student/dashboard'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { school_code: '', student_school_id: '', pin: '' },
  })

  const [formError, setFormError]     = useState<string | null>(null)
  const [showPin,   setShowPin]       = useState(false)
  const [resetOpen, setResetOpen]     = useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null)

    const result = await studentLogin({
      ...values,
      school_code: values.school_code.toUpperCase().trim(),
    })

    if (result.data?.user) {
      toast({
        title:       'Welcome back!',
        description: `Signed in as ${result.data.user.name}`,
      })
      // Just router.push() — an immediate router.refresh() right after races
      // the navigation's own RSC fetch, and if middleware redirects that fetch
      // (e.g. an onboarding-incomplete student → /student/finish-setup), the
      // client can't parse the redirect as an RSC payload and throws
      // "An unexpected response was received from the server."
      router.push(returnUrl)
      return
    }

    const message = result.error ?? 'Invalid school code, student ID, or PIN'
    setFormError(message)
    toast({ title: 'Sign in failed', description: message, variant: 'destructive' })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <FormField
          control={form.control}
          name="school_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">School Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. MIR-2024"
                  className="uppercase tracking-widest"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="student_school_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Student ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g. S001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">PIN</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••••"
                    maxLength={10}
                    className="pr-9"
                    {...field}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPin((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full mt-2 bg-gold hover:bg-gold/90 text-gold-foreground shadow-lg shadow-gold/25 font-bold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          <button
            type="button"
            className="font-medium text-gold hover:underline"
            onClick={() => setResetOpen(true)}
          >
            Forgot your PIN?
          </button>
          {' '}Or ask your teacher to reset it.
        </p>

      </form>

      <PinResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        initialSchoolCode={form.watch('school_code')}
        initialStudentId={form.watch('student_school_id')}
      />
    </Form>
  )
}