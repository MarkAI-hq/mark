import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, Shield, Award } from 'lucide-react'
import { getPublicCertificate } from '@/lib/actions/certificates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getPublicCertificate(id)
  if (!data) return { title: 'Certificate Not Found' }
  return {
    title: `Certificate — ${data.student_name} · ${data.subject_name}`,
    description: `Certificate issued by ${data.school_name}, verified by Mark.`,
  }
}

export default async function PublicCertificatePage({ params }: Props) {
  const { id } = await params
  const { data: cert, error } = await getPublicCertificate(id)

  if (error || !cert) notFound()

  const issuedDate = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const gradeColor =
    cert.score >= 80
      ? 'text-emerald-600'
      : cert.score >= 65
        ? 'text-amber-600'
        : 'text-red-600'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-surface-raised/20 to-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-foreground">Mark</span>
          </Link>
          <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Verified Document
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-16">
        {/* Verification badge */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-emerald-600">Verified by Mark</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This certificate is authentic and issued through the Mark platform.
          </p>
        </div>

        {/* Certificate card */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          {/* Gold accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#C9A84C] via-[#E8C96A] to-[#C9A84C]" />

          <div className="p-8">
            {/* Score + grade */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Certificate of Completion
                </p>
                <h1 className="mt-1 text-2xl font-bold text-foreground">
                  {cert.subject_name}
                </h1>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${gradeColor}`}>{cert.score}%</p>
                <p className="text-xs text-muted-foreground">Final Score</p>
              </div>
            </div>

            <div className="mb-6 border-t border-border/40 pt-6">
              <p className="mb-1 text-sm text-muted-foreground">Awarded to</p>
              <p className="text-xl font-semibold text-foreground">{cert.student_name}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-raised/40 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Issued by</p>
                <p className="mt-0.5 font-medium text-foreground">{cert.school_name}</p>
              </div>
              {issuedDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Date issued</p>
                  <p className="mt-0.5 font-medium text-foreground">{issuedDate}</p>
                </div>
              )}
              {cert.grade_level && (
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="mt-0.5 font-medium text-foreground">{cert.grade_level}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Verification code</p>
                <p className="mt-0.5 font-mono text-xs font-medium text-foreground">
                  {cert.verification_code}
                </p>
              </div>
            </div>

            {/* Download button */}
            {cert.download_url && (
              <div className="mt-6">
                <Button asChild className="w-full gap-2 bg-[#C9A84C] text-white hover:bg-[#A07830]">
                  <a href={cert.download_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                    Download Certificate PDF
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 bg-surface-raised/20 px-8 py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-[#C9A84C]" />
              <span>
                This certificate was issued on the Mark education platform. Verify at{' '}
                <span className="font-mono">mark.school/certificates/{cert.verification_code}</span>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
