'use client'

// src/components/auth/login-form.tsx

import { useState }                    from 'react'
import { useRouter, useSearchParams }  from 'next/navigation'
import { useForm }                     from 'react-hook-form'
import { zodResolver }                 from '@hookform/resolvers/zod'
import { z }                           from 'zod'
import Link                            from 'next/link'

import { toast }         from '@/hooks/use-toast'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input }   from '@/components/ui/input'
import { Button }  from '@/components/ui/button'
import { login }   from '@/lib/actions/auth'
import { ServerActionResponse, LoginResponse } from '@/lib/types'

// ── Role → default landing page ───────────────────────────────────────────
function getDefaultRedirect(roles: string[]): string {
  if (roles.includes('Admin'))   return '/dashboard'
  if (roles.includes('Teacher')) return '/dashboard/teacher'
  if (roles.includes('Student')) return '/student/dashboard'
  return '/dashboard'
}

// ── Schema ────────────────────────────────────────────────────────────────
const formSchema = z.object({
  email:    z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
})

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // return_url is respected only if explicitly set (e.g. from a middleware redirect)
  // We never default to a hardcoded path — role determines destination
  const explicitReturnUrl = searchParams.get('return_url')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver:      zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null)

    const result: ServerActionResponse<LoginResponse> = await login(
      values.email,
      values.password,
    )
    const { data, error } = result

    if (data?.user) {
      toast({
        title:       'Success',
        description: `Welcome, ${data.user.first_name} ${data.user.last_name}`,
      })

      // Determine destination:
      // 1. If middleware set an explicit return_url, use it
      //    BUT only if it matches the user's role scope to prevent
      //    a teacher being bounced back to an admin page they tried to access
      // 2. Otherwise route purely by role
      const roles: string[] = data.user.roles ?? [data.user.roles].filter(Boolean)
      const defaultDest     = getDefaultRedirect(roles)

      let destination = defaultDest

      if (explicitReturnUrl) {
        const isTeacher = roles.includes('Teacher')
        const isAdmin   = roles.includes('Admin')
        const isStudent = roles.includes('Student')

        // Validate the return_url is appropriate for this role
        const teacherBlockedPrefixes = [
          '/dashboard/settings',
          '/dashboard/students/new',
          '/dashboard/students/import',
          '/dashboard/classes/new',
          '/dashboard/members',
          '/dashboard/invitations',
        ]

        const returnUrlBlocked =
          (isTeacher && (
            teacherBlockedPrefixes.some(p => explicitReturnUrl.startsWith(p)) ||
            explicitReturnUrl === '/dashboard'
          )) ||
          (isStudent && !explicitReturnUrl.startsWith('/student')) ||
          (isAdmin   && explicitReturnUrl.startsWith('/student'))

        destination = returnUrlBlocked ? defaultDest : explicitReturnUrl
      }

      router.push(destination)
      router.refresh()
      return
    }

    if (error) {
      const message = error.message ?? 'Invalid email or password'
      setFormError(message)
      toast({
        title:       'Login failed',
        description: message,
        variant:     'destructive',
      })
      return
    }

    setFormError('An unknown error occurred')
    toast({
      title:       'Login failed',
      description: 'An unknown error occurred',
      variant:     'destructive',
    })
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700">Email</FormLabel>
              <FormControl>
                <Input placeholder="you@school.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-slate-700">Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-700 text-white mt-2"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-slate-900 hover:underline">
            Get started
          </Link>
        </p>

      </form>
    </Form>
  )
}