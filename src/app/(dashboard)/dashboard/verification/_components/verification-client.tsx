'use client'

import { useState }     from 'react'
import { useRouter }    from 'next/navigation'
import { toast }        from 'sonner'
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock,
  CheckCircle, ArrowRight, ExternalLink, RotateCcw,
  FileText, Plus, Trash2, Send,
} from 'lucide-react'
import { Button }                                     from '@/components/ui/button'
import { Input }                                      from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { submitVerification, SchoolVerification }     from '@/lib/actions/school-verification'
import { cn }                                         from '@/lib/utils'

interface Props {
  verification: SchoolVerification | null
}

// ── Step helpers ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'prepare', label: 'Prepare'      },
  { id: 'submit',  label: 'Submit Docs'  },
  { id: 'review',  label: 'Under Review' },
  { id: 'verified',label: 'Verified'     },
]

function currentStep(v: SchoolVerification | null): number {
  if (!v)                       return 0
  if (v.status === 'pending')   return 2
  if (v.status === 'more_info') return 1
  if (v.status === 'rejected')  return 1
  if (v.status === 'approved')  return 3
  return 0
}

// ── Progress stepper ─────────────────────────────────────────────────────────

function ProgressStepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = i < step
        const active = i === step
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done   && 'bg-gold text-gold-foreground',
                active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                !done && !active && 'bg-muted text-muted-foreground',
              )}>
                {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-[11px] font-medium whitespace-nowrap',
                active ? 'text-foreground' : done ? 'text-gold' : 'text-muted-foreground',
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-2 mb-5 transition-all',
                done ? 'bg-gold' : 'bg-border',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Benefits list ────────────────────────────────────────────────────────────

const BENEFITS = [
  'Verified school badge on all student records and certificates',
  'Unlock certificate issuance for passing students',
  'Priority support access',
  'Appear in the Mirror Intelligence school directory',
  'Trust signals for parent and guardian sign-ups',
  'Eligibility for national exam board integrations',
]

function BenefitsList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
      {BENEFITS.map((b) => (
        <div key={b} className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{b}</span>
        </div>
      ))}
    </div>
  )
}

// ── Document submission dialog ────────────────────────────────────────────────

interface SubmitDialogProps {
  open:         boolean
  onOpenChange: (v: boolean) => void
  initialUrls?: string[]
  title:        string
  description:  string
  submitLabel?: string
}

function SubmitDialog({
  open, onOpenChange, initialUrls = [''], title, description, submitLabel = 'Submit for Verification',
}: SubmitDialogProps) {
  const router            = useRouter()
  const [urls, setUrls]   = useState<string[]>(initialUrls)
  const [loading, setLoading] = useState(false)

  const update = (i: number, val: string) =>
    setUrls(u => u.map((v, idx) => (idx === i ? val : v)))
  const add    = () => setUrls(u => [...u, ''])
  const remove = (i: number) => setUrls(u => u.filter((_, idx) => idx !== i))

  async function handleSubmit() {
    const valid = urls.filter(u => u.trim())
    if (valid.length === 0) {
      toast.error('Please add at least one document URL.')
      return
    }
    setLoading(true)
    try {
      const { error } = await submitVerification(valid)
      if (error) { toast.error(error.message); return }
      toast.success('Verification request submitted.')
      onOpenChange(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">
            Upload your documents to Google Drive, Dropbox, or any cloud storage and paste the shareable links below.
          </p>
          <div className="space-y-2">
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-muted/30 border rounded-lg px-3 h-10">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    value={url}
                    onChange={e => update(i, e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
                  />
                </div>
                {urls.length > 1 && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={add} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add another document
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              : <><Send className="h-4 w-4" /> {submitLabel}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Status-specific panels ────────────────────────────────────────────────────

function NotStartedPanel({ onSubmit }: { onSubmit: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Why get verified?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <BenefitsList />
        <div className="pt-2 border-t border-border">
          <Button className="gap-2" onClick={onSubmit}>
            Get Your School Verified <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PendingPanel({ verification }: { verification: SchoolVerification }) {
  const docs = verification.documents_url ?? []
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Your application is under review</p>
          <p className="text-sm text-muted-foreground mt-1">
            Our team will review your submission within 2–3 business days. You&apos;ll see this page update once a decision is made.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Submitted {new Date(verification.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {docs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Submitted Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.map((url, i) => (
              <a
                key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors text-sm group"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-foreground/80">{url}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">What happens next</p>
          <ol className="space-y-2.5 text-sm text-muted-foreground">
            {[
              'Our team reviews your submitted documents for authenticity',
              'We cross-check against national school registration records where available',
              'You receive a decision — approved, or a note requesting additional information',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function MoreInfoPanel({ verification, onResubmit }: { verification: SchoolVerification; onResubmit: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
          <ShieldAlert className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Additional information required</p>
          {verification.notes && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{verification.notes}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Requested{verification.reviewed_at
              ? ` ${new Date(verification.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : ''}
          </p>
          <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onResubmit}>
            <RotateCcw className="h-3.5 w-3.5" /> Update &amp; Resubmit
          </Button>
        </div>
      </div>
    </div>
  )
}

function RejectedPanel({ verification, onResubmit }: { verification: SchoolVerification; onResubmit: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <ShieldX className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Verification was not approved</p>
          {verification.notes && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{verification.notes}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Reviewed{verification.reviewed_at
              ? ` ${new Date(verification.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : ''}
          </p>
          <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onResubmit}>
            <Send className="h-3.5 w-3.5" /> Submit New Application
          </Button>
        </div>
      </div>
    </div>
  )
}

function ApprovedPanel({ verification }: { verification: SchoolVerification }) {
  const date = verification.reviewed_at
    ? new Date(verification.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-6 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center">
          <ShieldCheck className="h-7 w-7 text-gold" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">Your school is verified</p>
          <p className="text-sm text-muted-foreground mt-1">
            All platform features are now unlocked.{date && ` Approved on ${date}.`}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Unlocked features</CardTitle>
        </CardHeader>
        <CardContent>
          <BenefitsList />
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function VerificationClient({ verification: raw }: Props) {
  // Guard against empty-object response (NestJS null → empty HTTP body → {} from fetcher)
  const verification  = raw?.id ? raw : null
  const step          = currentStep(verification)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Pre-fill with previous URLs when resubmitting
  const prevUrls = verification?.documents_url?.length
    ? verification.documents_url
    : ['']

  const dialogProps = (() => {
    if (!verification || !['more_info', 'rejected'].includes(verification.status)) {
      return {
        title:       'Submit Verification Documents',
        description: 'Provide your school registration certificate, accreditation letter, or government permit.',
        submitLabel: 'Submit for Verification',
        initialUrls: [''],
      }
    }
    if (verification.status === 'more_info') {
      return {
        title:       'Resubmit Verification Documents',
        description: 'Your previous documents are pre-filled. Update or add any that address the feedback.',
        submitLabel: 'Resubmit for Verification',
        initialUrls: prevUrls,
      }
    }
    return {
      title:       'Submit New Application',
      description: 'Address the reason above and provide updated or additional documents.',
      submitLabel: 'Submit New Application',
      initialUrls: [''],
    }
  })()

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School Accreditation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify your school to unlock the full Mirror Intelligence platform.
        </p>
      </div>

      <ProgressStepper step={step} />

      {!verification                        && <NotStartedPanel onSubmit={() => setDialogOpen(true)} />}
      {verification?.status === 'pending'   && <PendingPanel verification={verification} />}
      {verification?.status === 'more_info' && <MoreInfoPanel verification={verification} onResubmit={() => setDialogOpen(true)} />}
      {verification?.status === 'rejected'  && <RejectedPanel verification={verification} onResubmit={() => setDialogOpen(true)} />}
      {verification?.status === 'approved'  && <ApprovedPanel verification={verification} />}

      <SubmitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        {...dialogProps}
      />
    </div>
  )
}
