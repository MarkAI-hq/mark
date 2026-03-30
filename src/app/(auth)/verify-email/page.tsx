'use client'

// src/app/(auth)/verify-email/page.tsx

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter }   from 'next/navigation'
import { toast }                        from 'sonner'
import { verifyEmail }                  from '@/lib/actions/auth'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const hasRun       = useRef(false)

  const [status,  setStatus]  = useState<'loading' | 'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const token = searchParams.get('token')

    if (!token) {
      setMessage('No verification token found. Please check your link.')
      setStatus('error')
      toast.error('Verification Failed', { description: 'No token found in the URL.' })
      return
    }

    setStatus('loading')

    const handleVerification = async () => {
      const { data, error } = await verifyEmail(token)

      if (data) {
        const isAuthenticated = !!(data.accessToken && data.user)

        setMessage(
          isAuthenticated
            ? 'Email verified! Setting up your school…'
            : 'Email verified! Redirecting to login…'
        )
        setStatus('success')
        toast.success('Email Verified', {
          description: data.message || 'Your email has been verified.',
        })

        setTimeout(() => {
          router.push(isAuthenticated ? '/onboarding' : '/login')
        }, 1500)
      } else {
        setMessage(`Verification failed: ${error?.message || 'An unknown error occurred.'}`)
        setStatus('error')
        toast.error('Verification Failed', {
          description: error?.message || 'An error occurred. Redirecting to signup.',
        })
        setTimeout(() => router.push('/register'), 3000)
      }
    }

    handleVerification()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 shadow-lg rounded-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-24">
          {status === 'loading' && (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}