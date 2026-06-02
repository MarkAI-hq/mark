
import { Metadata } from 'next'
import ResetPasswordPage from '@/components/auth/reset-password'

export const metadata: Metadata = {
  title: 'Reset Password — Mirror Intelligence',
  description: 'Set a new password for your Mirror Intelligence account',
}

export default function ForgotPasswordPage() {
    return <ResetPasswordPage />
} 