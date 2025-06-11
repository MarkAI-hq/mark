
import { Metadata } from 'next'
import ResetPasswordPage from '@/components/auth/reset-password'

export const metadata: Metadata = {
    title: 'Forgot Pwd - Mark',
    description: 'Login to your account'
}

export default function ForgotPasswordPage() {
    return <ResetPasswordPage />
} 