'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import {
  Input
} from '@/components/ui/input'
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
import { useSearchParams, useRouter } from 'next/navigation'

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  })

export default function ResetPasswordForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  })

  const searchParams = useSearchParams()
  const router = useRouter()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const token = searchParams.get('token')

    if (!token) {
      toast.error('Invalid or missing token')
      return
    }

    try {
      const res = await fetch('https://mark.xrefracted.com/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: values.newPassword,
          token: token
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        const description = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || 'An error occurred'
        toast.error('Reset failed', { description })
        return
      }

      toast.success('Password reset successful', {
        description: 'You can now log in with your new password.'
      })

      router.push('/login')
    } catch (err) {
      console.error('Reset password error:', err)
      toast.error('Unexpected error', {
        description: 'Please try again later.'
      })
    }
  }

  return (
    <Card className='max-w-md mx-auto mt-10 p-6 shadow-lg'>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='New password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type='password' placeholder='Confirm new password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className='w-full'
              disabled={form.formState.isSubmitting}
              type='submit'
            >
              {form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
