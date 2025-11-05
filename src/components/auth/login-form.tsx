// src/components/auth/login-form.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'

// FIX: Import the correct toast function
import { toast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { login } from '@/lib/actions/auth'
import { ServerActionResponse, LoginResponse } from '@/lib/types'

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
})

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl =
    searchParams.get('return_url') || '/dashboard/classes'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result: ServerActionResponse<LoginResponse> = await login(
      values.email,
      values.password,
    )
    const { data, error } = result

    if (data?.user) {
      // FIX: Use the correct toast syntax
      toast({
        title: 'Success',
        description: `Welcome, ${data.user.first_name} ${data.user.last_name}`,
      })
      router.push(returnUrl)
      router.refresh()
      return
    }

    if (error) {
      const message = error.message ?? 'Invalid email or password'
      // FIX: Use the correct toast syntax with the 'destructive' variant for errors
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Login failed',
      description: 'An unknown error occurred',
      variant: 'destructive',
    })
  }

  return (
    <Card className="w-full max-w-sm mx-auto my-8 p-4 md:p-6 shadow-lg rounded-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold">Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email and password to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                    />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full mt-6"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="flex justify-between mt-4 text-sm">
              <Link href="/forgotpassword" className="hover:underline">
                Forgot password?
              </Link>
              <Link href="/signup" className="hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
