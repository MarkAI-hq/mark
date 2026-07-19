import Link from 'next/link'
import { ArrowLeftCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Thanks · Mirror Intelligence',
}

// MarzPay's payment-link redirect_url lands here after checkout — success or
// not. This page has no session (see middleware public paths: mobile money
// checkout can complete on a different device/browser than the one that
// started sign-up, so we can't assume auth here) and takes no reference param
// to look up, so it must never assert the payment succeeded. The actual
// confirmation happens via polling in the original sign-up tab
// (getAdmissionFeeStatus) — this is just the waypoint for the tab checkout
// happened in.
export default function PaymentCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
            <ArrowLeftCircle className="h-6 w-6 text-gold" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Thanks for that</h1>
            <p className="text-sm text-muted-foreground">
              You can close this tab now and return to the sign-up tab — it will pick
              up automatically once your payment is confirmed.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full font-bold">
            <Link href="/student/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
