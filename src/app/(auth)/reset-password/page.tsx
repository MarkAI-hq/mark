
import { Metadata } from 'next'
import ResetPasswordPage from '@/components/auth/reset-password'

export const metadata: Metadata = {
    title: 'Reset password - Mark',
    description: 'Reset password'
}

export default function ForgotPasswordPage() {
    return <ResetPasswordPage />
} 