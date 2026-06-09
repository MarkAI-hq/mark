'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OfferPreview {
  application_id: string
  school_name: string
  first_name: string
  enrollment_fee_usd: number
  status: string
}

export default function AcceptOfferPage() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [preview, setPreview] = useState<OfferPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  const paidStatus = searchParams.get('status')

  useEffect(() => {
    async function loadPreview() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admissions/accept-preview/${token}`,
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.message ?? 'This offer link is invalid or has expired.')
          return
        }
        const data = await res.json()
        setPreview(data)

        // If returning from Stripe with ?status=paid, the webhook may have already created the account
        if (paidStatus === 'paid') {
          setAccepted(true)
        }
      } catch {
        setError('Could not load offer details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadPreview()
  }, [token, paidStatus])

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admissions/accept/${token}`,
        { method: 'POST' },
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Could not accept offer. Please try again.')
        return
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }
      setAccepted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-surface-raised/40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-surface-raised/40 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Offer not found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/schools')}>
              Browse schools
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-surface-raised/40 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to {preview?.school_name}!</CardTitle>
            <CardDescription>
              Your account is ready. Check your email for your login PIN.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/student/login')}>
              Log in to your account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-surface-raised/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gold">
            <GraduationCap className="h-6 w-6 text-gold-foreground" />
          </div>
          <CardTitle>You&apos;ve been offered a place</CardTitle>
          <CardDescription>
            {preview?.first_name
              ? `Hi ${preview.first_name}, `
              : ''}{preview?.school_name} has offered you a place on Mirror Intelligence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">School</span>
              <span className="font-medium">{preview?.school_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium">Mirror Intelligence</span>
            </div>
            {preview && preview.enrollment_fee_usd > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Enrollment fee</span>
                <span className="font-medium">${preview.enrollment_fee_usd} USD</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
            ) : preview?.enrollment_fee_usd && preview.enrollment_fee_usd > 0 ? (
              `Accept & pay $${preview.enrollment_fee_usd}`
            ) : (
              'Accept offer'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, your student account will be created and you will
            receive a login PIN by email.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
