import { Metadata } from 'next'
import { MultiStepSignupForm } from "@/components/auth/multi-step-signup-form"

export const metadata: Metadata = {
  title: 'Register - Mark',
  description: 'Create your account'
}

export default function SignUpPage() {
  return <MultiStepSignupForm />
}
