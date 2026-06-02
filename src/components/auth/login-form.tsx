'use client'

// src/components/auth/login-form.tsx

import { useState }                    from 'react'
import { useRouter, useSearchParams }  from 'next/navigation'
import { Eye, EyeOff }                from 'lucide-react'
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
  if (roles.includes('Root'))    return '/root'
  if (roles.includes('Support')) return '/root'
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

  const [formError,    setFormError]    = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
      const roles: string[] = data.user.roles ?? []
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

  // SSO error from callback redirect
  const ssoError = searchParams.get('error') === 'sso_failed'
    ? (searchParams.get('message') ?? 'SSO authentication failed')
    : null

  const googleSsoHref = `/api/auth/google${explicitReturnUrl ? `?return_url=${encodeURIComponent(explicitReturnUrl)}` : ''}`

  return (
    <Form {...form}>
      {/* Google SSO */}
      <a
        href={googleSsoHref}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors mb-4"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58Z"/>
        </svg>
        Continue with Google
      </a>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {(formError || ssoError) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError ?? ssoError}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email</FormLabel>
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
                <FormLabel className="text-foreground">Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-[#926C15] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...field} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-[#926C15] hover:underline">
            Get started
          </Link>
        </p>

      </form>
    </Form>
  )
}