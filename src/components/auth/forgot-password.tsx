'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' })
})

export default function ForgotPasswordForm() {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (res.ok) {
        toast.success('Email sent', {
          description: 'Please check your inbox for the reset link.'
        })
        setTimeout(() => router.push('/login'), 2000)
      } else {
        const errorData = await res.json()
        toast.error('Reset failed', {
          description: errorData.message || 'Something went wrong. Please try again.'
        })
      }
    } catch {
      toast.error('Network error', {
        description: 'Unable to connect. Please try again later.'
      })
    }
  }

  return (
    <Card className='max-w-md mx-auto mt-10 p-6 shadow-lg bg-white dark:bg-black/90'>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='you@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='w-full' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="flex justify-center mt-2">
                <Link href="/login" className="text-sm hover:underline">
                    Back to Login
                </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
