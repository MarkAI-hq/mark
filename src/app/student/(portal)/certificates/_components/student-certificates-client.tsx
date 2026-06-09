'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Award, ExternalLink, Download, Users, Copy, Check, Gift, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCelebration } from '@/hooks/use-celebration'
import type { Certificate } from '@/lib/actions/certificates'
import type { ReferralCode, ReferralInvites } from '@/lib/actions/referrals'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Props {
  user: any
  certificates: Certificate[]
  referralCode: ReferralCode | null
  invites: ReferralInvites | null
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Awaiting payment', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  paid: { label: 'Generating…', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  issued: { label: 'Issued', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  revoked: { label: 'Revoked', color: 'text-red-600 bg-red-50 border-red-200' },
}

export function StudentCertificatesClient({ user, certificates, referralCode, invites }: Props) {
  const [copied, setCopied] = useState(false)
  const { celebrate } = useCelebration()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('status') === 'success' && certificates.some((c) => c.status === 'paid' || c.status === 'issued')) {
      celebrate('cert')
      toast.success('Certificate payment confirmed! Your certificate is being generated.')
    }
  }, [])

  const enrolled = invites?.enrolled ?? 0
  const nextAt = invites?.next_reward_at ?? 5
  const progressPct = Math.min(((enrolled % 5) / 5) * 100, 100)

  function copyLink() {
    if (!referralCode?.referral_url) return
    navigator.clipboard.writeText(referralCode.referral_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsapp() {
    if (!referralCode?.referral_url) return
    const msg = encodeURIComponent(
      `I'm studying at my school on Mark — AI-powered, completely free. Join me and we both earn a free exam! ${referralCode.referral_url}`,
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn certificates by passing assessments. Invite 5 friends to unlock a free exam.
        </p>
      </div>

      {/* Referral widget */}
      {referralCode && (
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/8 to-background p-5 dark:from-gold/5 dark:to-background">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-4 w-4 text-gold" />
            <p className="font-semibold text-foreground">Invite 5 friends → Free exam fee</p>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{enrolled % 5} / 5 friends enrolled</span>
              {enrolled >= 5 && (
                <span className="font-medium text-emerald-600">
                  {Math.floor(enrolled / 5)} free exam{Math.floor(enrolled / 5) > 1 ? 's' : ''} earned
                </span>
              )}
            </div>
            <Progress value={progressPct} className="h-2" />
            {nextAt < 5 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {nextAt} more friend{nextAt !== 1 ? 's' : ''} to unlock your next free exam
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs font-mono text-muted-foreground truncate">
              {referralCode.referral_url}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1"
              onClick={copyLink}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              size="sm"
              className="shrink-0 gap-1 bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={shareWhatsapp}
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Certificates list */}
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Award className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No certificates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete an assessment and request a certificate when you pass.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const badge = STATUS_BADGE[cert.status] ?? STATUS_BADGE.pending
            return (
              <div
                key={cert.certificate_id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Award className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cert.certificate_title}</p>
                    {cert.issued_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(cert.issued_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                  {cert.verification_code && cert.status === 'issued' && (
                    <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <Link href={`/certificates/${cert.verification_code}`} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  )}
                  {cert.pdf_url && cert.status === 'issued' && (
                    <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-3 w-3" />
                        PDF
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
