import { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/forgot-password'

export const metadata: Metadata = {
    title: 'Forgot password - Mark',
    description: 'Forgot password'
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}