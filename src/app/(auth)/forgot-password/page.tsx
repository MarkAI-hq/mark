import { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/forgot-password'

export const metadata: Metadata = {
  title: 'Forgot Password — Mirror Intelligence',
  description: 'Reset your Mirror Intelligence account password',
}

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />
}