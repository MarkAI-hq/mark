import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
    title: 'Register - Mark',
    description: ' Create your account'
}

export default function SignUpPage() {
    return <SignUpForm />
} 