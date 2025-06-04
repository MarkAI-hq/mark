'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link' // Added Link import for the login link

// --- NEW IMPORTS FOR zod-phone-number ---
import { ZodPhoneNumber, RETURNING_FORMAT } from 'zod-phone-number';
// ----------------------------------------

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
import { signUp } from '@/lib/actions/auth' // Ensure this function is updated to accept phone and photo

const formSchema = z.object({
    name: z.string().min(1, {
        message: 'Name is required.'
    }),
    email: z.string().email({
        message: 'Please enter a valid email address.'
    }),
    // --- UPDATED PASSWORD LENGTH TO MATCH BACKEND DTO (MinLength(8)) ---
    password: z.string().min(8, { // Changed from 6 to 8
        message: 'Password must be at least 8 characters.'
    }),
    confirmPassword: z.string().min(8, { // Changed from 6 to 8 to match password
        message: 'Confirm Password must be at least 8 characters.'
    }),
    // --- ADDED PHONE FIELD WITH zod-phone-number VALIDATION ---
    phone: ZodPhoneNumber.phoneNumber({
        // For consistent international format validation with backend's @IsPhoneNumber()
        returningFormat: RETURNING_FORMAT['E.164'],
        // You can add a defaultRegion if most users are from one country (e.g., 'UG' for Uganda)
        // defaultRegion: 'UG'
    }),
    // --- ADDED OPTIONAL PHOTO FIELD ---
    photo: z.instanceof(File).optional(), // Use z.instanceof(File) for file inputs, making it optional
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword']
});

export function SignUpForm() {
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: '',         // Added default for phone (empty string for mandatory string)
            photo: undefined   // Added default for photo (undefined for optional file)
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Destructure all relevant values, including phone and photo
        const { name, email, password, phone, photo } = values;

        // Pass all collected parameters to the signUp action
        const { data, error } = await signUp(name, email, password, phone, photo);

        if (data) {
            toast.success('Success', {
                description: `Registration successful. Please check your email to verify your account.`
            })
            router.push('/dashboard') // Redirect to dashboard or a verification message page
        }
        if (error) {
            toast.error('Sign up failed', {
                description: error.message || 'An error occurred during sign up'
            })
        }
    }

    return (
        // --- ADDED STYLING FOR CENTERING AND SHADOW ---
        <Card className='w-full max-w-sm mx-auto my-8 p-4 md:p-6 shadow-lg rounded-lg'>
            <CardHeader className='space-y-1 text-center'> {/* Centered text */}
                <CardTitle className='text-3xl font-bold'>Sign Up</CardTitle> {/* Larger, bolder title */}
                <CardDescription className='text-muted-foreground'> {/* Subtler description text */}
                    Enter your details to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='Enter your name'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Email Field */}
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
                        {/* --- NEW PHONE FIELD --- */}
                        <FormField
                            control={form.control}
                            name='phone'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel> {/* Label updated */}
                                    <FormControl>
                                        <Input
                                            placeholder='e.g., +2567xxxxxxxx'
                                            type='tel' // Use type="tel" for phone numbers
                                            {...field}                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* ------------------- */}
                        {/* Password Field */}
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
                        {/* Confirm Password Field */}
                        <FormField
                            control={form.control}
                            name='confirmPassword'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='password'
                                            placeholder='Confirm your password'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* --- NEW PHOTO FIELD (OPTIONAL) --- */}
                        <FormField
                            control={form.control}
                            name='photo'
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Profile Photo (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...fieldProps}
                                            type='file'
                                            accept='image/jpeg,image/png,image/jpg' // Specify accepted file types
                                            onChange={(event) => {
                                                // Get the file object from the files array
                                                onChange(event.target.files && event.target.files[0]);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* ------------------------------ */}
                        <Button
                            type='submit'
                            className='w-full mt-6' // Added margin-top for spacing
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? 'Signing up...' : 'Sign up'}
                        </Button>
                    </form>
                </Form>
                {/* --- ADDED LOGIN LINK --- */}
                <div className="mt-4 text-center text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                        Login
                    </Link>
                </div>
                {/* ---------------------- */}
            </CardContent>
        </Card>
    )
}