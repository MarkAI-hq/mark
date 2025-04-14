'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/lib/actions/auth'

const formSchema = z.object({
    email: z.string().email({
        message: 'Please enter a valid email address.'
    }),
    password: z.string().min(6, {
        message: 'Password must be at least 6 characters.'
    })
})

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('return_url') || '/dashboard/subjects'

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { data, error } = await login(values.email, values.password)

        if (data) {
            toast.success('Success', {
                description: `Welcome, ${data.user.name}`
            })
            router.push(returnUrl)
        }
        if (error) {
            toast.error('Login failed', {
                description: error.message || 'Invalid email or password'
            })
        }
    }

    return (
        <Card className='w-full max-w-sm'>
            <CardHeader className='space-y-1'>
                <CardTitle className='text-2xl'>Login</CardTitle>
                <CardDescription>
                    Enter your email and password to login
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='Enter your email'
                                            type='email'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='password'
                                            placeholder='Enter your password'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type='submit'
                            className='w-full'
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                        <div className="flex justify-between mt-2">
                            <Link href="#" className="text-sm hover:underline">
                                Forgot password?
                            </Link>
                            <Link href="#" className="text-sm hover:underline ">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}