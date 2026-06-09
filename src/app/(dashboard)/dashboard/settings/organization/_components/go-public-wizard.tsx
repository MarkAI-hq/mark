'use client'

import { useState, useTransition } from 'react'
import {
  Globe, ClipboardList, DollarSign, ShieldCheck,
  ArrowRight, ArrowLeft, CheckCircle2, Users,
  Building2, FileCheck, Loader2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { goPublic } from '@/lib/actions/organizations'
import { cn } from '@/lib/utils'

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  schoolName:   string
  onSuccess:    () => void
}

const TOTAL_STEPS = 4

const BENEFITS = [
  { icon: Globe,         title: 'Get Discovered',       desc: 'Appear in the Mirror Intelligence school directory' },
  { icon: ClipboardList, title: 'Manage Applications',  desc: 'Review and approve student applications' },
  { icon: DollarSign,    title: 'Earn Revenue',          desc: 'Certificates, extras, and exam registrations' },
  { icon: ShieldCheck,   title: 'Build Trust',           desc: 'Earn a verified badge for your school' },
]

const HOW_IT_WORKS = [
  { icon: Globe,         label: 'Published',   desc: 'Your school profile is published to the Mirror Intelligence directory' },
  { icon: Users,         label: 'Discovered',  desc: 'Students browse and apply to your school' },
  { icon: ClipboardList, label: 'Review',       desc: 'You review applications in the Admissions dashboard' },
  { icon: CheckCircle2,  label: 'Enrolled',     desc: 'Approved students enroll and access your curriculum' },
  { icon: DollarSign,    label: 'Revenue',      desc: 'Revenue flows through your School Hub' },
]

const UNLOCKS = ['Admissions', 'School Hub', 'Verification']

const RESPONSIBILITIES = [
  'Keep your school profile and pricing accurate',
  'Review student applications and respond in a timely manner',
  'Complete school verification to display the verified badge',
  'Comply with Mirror Intelligence Marketplace Policies',
]

export function GoPublicWizard({ open, onOpenChange, schoolName, onSuccess }: Props) {
  const [step, setStep]           = useState(1)
  const [direction, setDirection] = useState<'fwd' | 'bck'>('fwd')
  const [animKey, setAnimKey]     = useState(0)
  const [signedBy, setSignedBy]   = useState('')
  const [agreed, setAgreed]       = useState(false)
  const [isPending, startT]       = useTransition()

  function navigate(target: number, dir: 'fwd' | 'bck') {
    setDirection(dir)
    setAnimKey(k => k + 1)
    setStep(target)
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => { setStep(1); setSignedBy(''); setAgreed(false) }, 300)
  }

  function handleSubmit() {
    const name = signedBy.trim()
    if (!name || !agreed) return
    startT(async () => {
      const { error } = await goPublic(name)
      if (error) {
        toast({ title: 'Failed to go public', description: error.message, variant: 'destructive' })
      } else {
        toast({ title: 'Your school is now listed publicly!' })
        handleClose()
        onSuccess()
      }
    })
  }

  const animClass = direction === 'fwd' ? 'gp-wiz-fwd' : 'gp-wiz-bck'
  const canSubmit = signedBy.trim().length > 0 && agreed

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <style>{`
        @keyframes gpFwd {
          from { opacity:0; transform:translateX(28px) }
          to   { opacity:1; transform:translateX(0)    }
        }
        @keyframes gpBck {
          from { opacity:0; transform:translateX(-28px) }
          to   { opacity:1; transform:translateX(0)     }
        }
        .gp-wiz-fwd { animation: gpFwd 0.24s cubic-bezier(0.22,1,0.36,1) both }
        .gp-wiz-bck { animation: gpBck 0.24s cubic-bezier(0.22,1,0.36,1) both }
      `}</style>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gold" />
            Join the Marketplace
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                i < step ? 'bg-gold' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div key={animKey} className={cn('min-h-[320px]', animClass)}>

          {/* ── Step 1: Benefits ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base">Join the Mirror Intelligence School Network</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  List your school publicly and unlock a new channel for student growth and revenue.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gold shrink-0" />
                      <span className="text-xs font-semibold">{title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: How It Works ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base">How It Works</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Five steps from listing to revenue.</p>
              </div>
              <ol className="space-y-3">
                {HOW_IT_WORKS.map(({ icon: Icon, label, desc }, i) => (
                  <li key={label} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
                <p className="text-xs font-semibold text-gold mb-2">You&apos;ll unlock</p>
                <div className="flex flex-wrap gap-1.5">
                  {UNLOCKS.map(item => (
                    <Badge key={item} variant="outline" className="text-xs border-gold/30 text-gold gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Responsibilities ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base">Your Responsibilities</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  As a listed school, you agree to the following:
                </p>
              </div>
              <ul className="space-y-3">
                {RESPONSIBILITIES.map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Going public is reversible. You can remove your listing at any time from Organisation Settings.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 4: Agreement ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base">Agreement &amp; Signature</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  By signing below, you confirm that <strong>{schoolName}</strong> agrees to be publicly listed on the Mirror Intelligence marketplace, to review student applications in good faith, and to comply with Mirror Intelligence Marketplace Policies.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gp-signature" className="text-sm">
                  Type your full name to sign
                </Label>
                <Input
                  id="gp-signature"
                  placeholder="e.g. Jane Nakamura"
                  value={signedBy}
                  onChange={e => setSignedBy(e.target.value)}
                  className="font-medium"
                  disabled={isPending}
                />
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="gp-agree"
                  checked={agreed}
                  onCheckedChange={v => setAgreed(!!v)}
                  disabled={isPending}
                />
                <Label htmlFor="gp-agree" className="text-sm leading-relaxed cursor-pointer">
                  I confirm I am authorised to sign on behalf of <strong>{schoolName}</strong> and agree to the Mirror Intelligence Marketplace Policies.
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 1 ? handleClose : () => navigate(step - 1, 'bck')}
            disabled={isPending}
          >
            {step === 1 ? 'Cancel' : <><ArrowLeft className="h-3.5 w-3.5 mr-1" />Back</>}
          </Button>

          <span className="text-xs text-muted-foreground">{step} of {TOTAL_STEPS}</span>

          {step < TOTAL_STEPS ? (
            <Button size="sm" onClick={() => navigate(step + 1, 'fwd')}>
              Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
            >
              {isPending
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Going Public…</>
                : <><Globe className="h-3.5 w-3.5 mr-1.5" />Go Public</>
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
