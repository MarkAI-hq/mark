import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
	title: 'Login - Mark',
	description: 'Login to your account'
}

export default function LoginPage() {
	return <LoginForm />
} 