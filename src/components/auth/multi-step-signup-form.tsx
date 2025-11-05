'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle2, User, FileText, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signUp } from '@/lib/actions/auth'

/* -----------------------
    Validation schema
    ----------------------- */
const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),

    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to-say']).optional(),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
    emergency_contact: z.string().optional(),
    preferred_language: z.string().default('en'),

    roles: z.string().min(1, 'Please select a role'),
    accept_terms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

const STEPS = [
  { id: 1, title: 'Account', icon: User },
  { id: 2, title: 'Details', icon: FileText },
  { id: 3, title: 'Finish', icon: Shield },
]

const ROLES = ['Teacher', 'Student', 'Admin', 'Parent']
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
]

export function MultiStepSignupForm() {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      preferred_language: 'en',
      roles: '',
      accept_terms: false,
    },
  })

  const selectedRole = watch('roles') || ''
  const acceptTerms = watch('accept_terms') ?? false
  const preferredLanguage = watch('preferred_language') ?? 'en'
  const gender = watch('gender') ?? ''

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof SignupFormData)[] = []
    if (step === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword', 'first_name', 'last_name']
    } else if (step === 2) {
      fieldsToValidate = ['phone_number', 'preferred_language']
    } else if (step === 3) {
      fieldsToValidate = ['roles', 'accept_terms']
    }
    return await trigger(fieldsToValidate)
  }

  const handleNext = async () => {
    const ok = await validateStep(currentStep)
    // Only proceed to the next step if validation passes AND it's not the final step (3)
    if (ok && currentStep < 3) {
        setCurrentStep((p) => Math.min(p + 1, 3))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((p) => Math.max(p - 1, 1))
  }

  // New handler for the linked login button
  const handleLoginRedirect = () => {
    router.push('/verify-email');
  }

  async function onSubmit(data: SignupFormData) {
    // Run final validation before submission
    const finalCheckOk = await validateStep(3);
    if (!finalCheckOk) return;

    setIsSubmitting(true)

    // 1. Sanitize Data
    const sanitizedData = {
        ...data,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender || undefined,
        emergency_contact: data.emergency_contact || undefined,
    }

    // Logging for server-side debugging
    console.log('--- Attempting Signup with Data (for backend action) ---')
    const { password, confirmPassword, ...dataToLog } = sanitizedData;
    console.log(dataToLog)
    console.log('---------------------------------------------------------')

    try {
      // Execute the signUp action
      const { data: error } = await signUp(
        sanitizedData.first_name,
        sanitizedData.last_name,
        sanitizedData.email,
        sanitizedData.password,
        sanitizedData.phone_number || undefined,
        undefined,
        sanitizedData.accept_terms
      )

      if (error) {
        // 2. Log API/Server Error explicitly and defensively check for the 'message' property
        console.error('SERVER ACTION ERROR during signup:', error);

        // Safely access 'message' property, providing a fallback
        const errorMessage =
            (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
            ? error.message
            : 'Registration failed due to an unknown server error.';

        toast({
          title: 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        })
        return // IMPORTANT: Do not redirect on error
      }

      // -----------------------------------------------------------------
      // ✅ SUCCESS ALERT AND REDIRECT (Code from previous request)
      // -----------------------------------------------------------------
      toast({
        title: 'Success! 🎉',
        description: 'Registration successful. Please check your email to verify your account.',
      })

      // Redirect to login ONLY on success
      router.push('/login')

    } catch (err: any) {
      // 4. Log Unexpected Client/Network Error
      console.error('UNEXPECTED CLIENT/NETWORK ERROR:', err);

      toast({
        title: 'Network Error',
        description: err instanceof Error ? err.message : 'A client-side connection error occurred. Check your network.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /* Helper for allowed-color styling: */
  const COLOR_PRIMARY = '#926C15' // Golden
  const COLOR_TEXT = '#555' // Light Gray text for light mode
  const WHITE = '#ffffff'

  // Refactoring styles outside JSX for clarity
  const getCircleStyle = (isCompleted: boolean, isActive: boolean): React.CSSProperties =>
    isCompleted
      ? { backgroundColor: COLOR_PRIMARY, borderColor: COLOR_PRIMARY, color: WHITE }
      : isActive
      ? { backgroundColor: WHITE, borderColor: COLOR_PRIMARY, color: COLOR_PRIMARY }
      : { backgroundColor: WHITE, borderColor: COLOR_TEXT, color: COLOR_TEXT }

  const getTextStyle = (isActive: boolean): React.CSSProperties => ({
    marginTop: 8,
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? COLOR_PRIMARY : COLOR_TEXT,
  })

  return (
    <>
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center" style={{ color: COLOR_PRIMARY }}>Create Account</CardTitle>
          <CardDescription className="text-center">Complete all steps to create your account</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress Indicator (unchanged) */}
          <div className="mb-8 px-4">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                const circleStyle = getCircleStyle(isCompleted, isActive)
                const textStyle = getTextStyle(isActive)

                const barStyle: React.CSSProperties = {
                  height: 2,
                  flex: 1,
                  marginLeft: 8,
                  marginRight: 8,
                  backgroundColor: currentStep > step.id ? COLOR_PRIMARY : COLOR_TEXT,
                  transition: 'background-color .2s',
                }

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all"
                        style={circleStyle}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" style={{ color: WHITE }} />
                        ) : (
                          <Icon className="w-6 h-6" style={{ color: circleStyle.color as string }} />
                        )}
                      </div>

                      <span style={textStyle}>{step.title}</span>
                    </div>

                    {index < STEPS.length - 1 && <div style={barStyle} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" placeholder="John" {...register('first_name')} />
                    {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" placeholder="Doe" {...register('last_name')} />
                    {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" {...register('email')} />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                  <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input id="phone_number" type="tel" placeholder="+1 234 567 8900" {...register('phone_number')} />
                      {errors.phone_number && <p className="text-sm text-red-500 mt-1">{errors.phone_number.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label htmlFor="date_of_birth">Date of Birth</Label>
                          <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                      </div>
                      <div>
                          <Label htmlFor="gender">Gender</Label>
                          <Select value={gender} onValueChange={(val) => setValue('gender', val as any)}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <div>
                      <Label htmlFor="emergency_contact">Emergency Contact</Label>
                      <Input id="emergency_contact" placeholder="+1 234 567 8900" {...register('emergency_contact')} />
                  </div>

                  <div>
                      <Label htmlFor="preferred_language">Preferred Language</Label>
                      <Select value={preferredLanguage} onValueChange={(val) => setValue('preferred_language', val)}>
                      <SelectTrigger>
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                          </SelectItem>
                          ))}
                      </SelectContent>
                      </Select>
                  </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Select Your Role</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setValue('roles', role)}
                        className={`p-3 rounded-lg border-2 text-left transition-all
                                        dark:text-white dark:border-gray-700 dark:hover:border-gray-500 ${selectedRole === role ? 'ring-2 ring-offset-2' : ''}`}
                        style={{
                          borderColor: selectedRole === role ? COLOR_PRIMARY : '#ddd',
                          backgroundColor: selectedRole === role ? `${COLOR_PRIMARY}10` : WHITE,
                          color: selectedRole === role ? COLOR_PRIMARY : COLOR_TEXT,
                        }}
                        data-role-selected={selectedRole === role}
                        data-color-primary={COLOR_PRIMARY}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  {errors.roles && <p className="text-sm text-red-500 mt-1">{errors.roles.message}</p>}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept_terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setValue('accept_terms', checked as boolean)}
                    style={{ borderColor: acceptTerms ? COLOR_PRIMARY : COLOR_TEXT, backgroundColor: acceptTerms ? COLOR_PRIMARY : WHITE }}
                  />
                  <Label htmlFor="accept_terms" className="cursor-pointer">
                    I accept the{' '}
                    <a href="/terms" className="underline" style={{ color: COLOR_PRIMARY }}>
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="underline" style={{ color: COLOR_PRIMARY }}>
                      Privacy Policy
                    </a>
                    .
                  </Label>
                </div>

                {errors.accept_terms && <p className="text-sm text-red-500 mt-1">{errors.accept_terms.message}</p>}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isSubmitting}
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext} style={{ backgroundColor: COLOR_PRIMARY }} className="text-white hover:opacity-90">
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: COLOR_PRIMARY }}
                  className="text-white hover:opacity-90 dark:bg-yellow-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* 🚀 Linked Login Button (Industry Standard) 🚀   */}
      {/* ---------------------------------------------------- */}
      <div className="mt-4 text-center">
        <p className="text-sm dark:text-gray-400">
          Already have an account?{' '}
          <Button
            variant="link"
            onClick={handleLoginRedirect}
            className="p-0 h-auto font-medium"
            style={{ color: COLOR_PRIMARY }}
          >
            Log In
          </Button>
        </p>
      </div>
    </>
  )
}