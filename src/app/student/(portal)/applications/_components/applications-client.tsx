'use client'

import { ClipboardList, Clock, Mail, CheckCircle2, XCircle, HelpCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ApplicationRecord } from '@/lib/actions/admissions'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<
  ApplicationRecord['status'],
  { label: string; icon: typeof Clock; className: string; hint: string }
> = {
  pending: {
    label: 'Pending review',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700',
    hint: "The school hasn't reviewed this application yet. You'll hear back within 24 hours.",
  },
  more_info: {
    label: 'More info needed',
    icon: HelpCircle,
    className: 'bg-blue-100 text-blue-700',
    hint: 'The school has requested more information. Check your email for details.',
  },
  offer_sent: {
    label: 'Offer sent',
    icon: Mail,
    className: 'bg-[#FBF5E6] text-[#C9A84C]',
    hint: "You've been offered a place! Check your email for the link to accept.",
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700',
    hint: 'This application was approved.',
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
    hint: 'This application was not successful.',
  },
}

interface Props {
  applications: ApplicationRecord[]
}

export function ApplicationsClient({ applications }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status of applications submitted under your email address.
        </p>
      </div>

      {applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => {
            const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
            const Icon = cfg.icon
            return (
              <Card key={app.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        {app.school_code}
                      </CardTitle>
                      <CardDescription>
                        Applied {format(new Date(app.createdAt), 'dd MMM yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-sm text-muted-foreground">{cfg.hint}</p>

                  {app.ai_summary && (
                    <div className="rounded-lg border border-[#C9A84C]/20 bg-[#FBF5E6] px-3 py-2.5 dark:bg-[#1a1600]">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-[#C9A84C]" />
                        <span className="text-xs font-medium text-[#C9A84C]">AI Assessment</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{app.ai_summary}</p>
                    </div>
                  )}

                  {app.status === 'declined' && app.review_note && (
                    <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Note from the school</p>
                      <p className="text-sm text-foreground">{app.review_note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No applications on record for your email address yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
