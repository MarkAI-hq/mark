'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'

// --- IMPORTS FOR zod-phone-number ---
import { ZodPhoneNumber, RETURNING_FORMAT } from 'zod-phone-number'
// ----------------------------------------

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
import { signUp } from '@/lib/actions/auth' // Make sure this signature is (name, email, pass, phone: string, photo?: File)

//
// ─── SCHEMA DEFINITION ────────────────────────────────────────────────────────────────
//
const formSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z.string().min(8, { message: 'Confirm Password must be at least 8 characters.' }),

    // ─── PHONE FIELD: transform the ZodPhoneNumber output into a plain string ───
    phone: ZodPhoneNumber.phoneNumber({
      returningFormat: RETURNING_FORMAT['E.164'],
      // defaultRegion: 'UG',
    }).transform((val): string => {
      // If val is undefined (no input) or already a string, return it or an empty string
      if (val == null || typeof val === 'string') {
        return val ?? ''
      }
      // Otherwise, val is the object type from zod-phone-number; extract its formattedNumber
      return val.formattedNumber
    }),

    // ─── OPTIONAL PHOTO FIELD ───────────────────────────────────────────────────────
    photo: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
//
// ──────────────────────────────────────────────────────────────────────────────────────
//

export function SignUpForm() {
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',      
      photo: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { name, email, password, phone, photo } = values

    const { data, error } = await signUp(name, email, password, phone, photo)

    if (data) {
      toast.success('Success', {
        description: `Registration successful. Please check your email to verify your account.`,
      })
      router.push('/dashboard')
    }
    if (error) {
      toast.error('Sign up failed', {
        description: error.message || 'An error occurred during sign up',
      })
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto my-8 p-4 md:p-6 shadow-lg rounded-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold">Sign Up</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your details to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., +2567xxxxxxxx"
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Field (optional) */}
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => {
                // Only extract the props input[type=file] needs:
                const { onChange, onBlur, name, ref } = field
                return (
                  <FormItem>
                    <FormLabel>Profile Photo (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        name={name}
                        // Do NOT spread field.value (File) into value prop
                        onChange={(ev) => {
                          const file = ev.target.files ? ev.target.files[0] : undefined
                          onChange(file)
                        }}
                        onBlur={onBlur}
                        ref={ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
