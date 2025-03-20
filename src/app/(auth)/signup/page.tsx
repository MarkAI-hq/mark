import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
    title: 'Sign Up - Mark',
    description: ' Create your account'
}

export default function SignUpPage() {
    return <SignUpForm />
} 