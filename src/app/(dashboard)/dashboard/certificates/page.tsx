import { Metadata } from 'next'
import { Award, ExternalLink, Download, Clock } from 'lucide-react'
import { getOrgCertificates } from '@/lib/actions/certificates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Certificates' }

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending payment', variant: 'secondary' },
  paid: { label: 'Generating PDF', variant: 'secondary' },
  issued: { label: 'Issued', variant: 'default' },
  revoked: { label: 'Revoked', variant: 'destructive' },
}

export default async function CertificatesPage() {
  const { data: certs, error } = await getOrgCertificates()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all certificates requested and issued for your school.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}

      {(!certs || certs.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
          <Award className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No certificates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Students earn certificates when they pass assessments and complete payment.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Certificate</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {certs.map((cert) => {
                  const { label, variant } = STATUS_BADGE[cert.status] ?? STATUS_BADGE.pending
                  return (
                    <tr key={cert.certificate_id} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{cert.certificate_title}</p>
                        {cert.verification_code && (
                          <p className="text-xs font-mono text-muted-foreground">{cert.verification_code}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">—</td>
                      <td className="px-4 py-3">
                        <Badge variant={variant} className="text-xs">
                          {cert.status === 'paid' && <Clock className="mr-1 h-3 w-3" />}
                          {label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {cert.issued_at
                          ? new Date(cert.issued_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cert.verification_code && cert.status === 'issued' && (
                            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              <Link
                                href={`/certificates/${cert.verification_code}`}
                                target="_blank"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Verify
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
