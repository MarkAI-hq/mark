import { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/forgot-password'

export const metadata: Metadata = {
    title: 'Forgot Pwd - Mark',
    description: 'Login to your account'
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}