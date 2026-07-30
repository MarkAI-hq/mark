'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { useCurrency } from '@/components/providers/currency-provider'
import { CURRENCIES } from '@/config/currencies'
import {
  CheckCircle2, Zap, Building2, Shield,
  AlertTriangle, Loader2, ExternalLink, Settings,
  MapPin, Brain, RefreshCw, Coins,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { detectRegion, REGIONAL_PRICES } from '@/lib/billing-utils'
import type { BillingRegion }            from '@/lib/billing-utils'

import {
  type Subscription,
  type GradingQuota,
  initializePayment,
  createPortalSession,
} from '@/lib/actions/subscriptions'

// ── Static plan data ───────────────────────────────────────────────────────

const PLAN_META = {
  free: {
    icon:  Shield,
    color: 'text-muted-foreground',
    bg:    'bg-muted',
    label: 'Free',
    desc:  'For individual teachers getting started.',
    features: [
      '30 students',
      '3 AI gradings / month',
      'Student dashboard & analytics',
      'Basic cognitive profiling',
      'Watermarked reports',
    ],
  },
  pro: {
    icon:    Zap,
    color:   'text-amber-600',
    bg:      'bg-amber-500/10',
    label:   'Pro',
    desc:    'For schools ready to go all-in.',
    popular: true,
    features: [
      'Unlimited students',
      'Unlimited AI grading',
      'Full reports — no watermarks',
      'Bulk PDF export',
      "Advanced analytics + Bloom's radar",
      'Guardian contact management',
      'Priority support',
    ],
  },
  enterprise: {
    icon:  Building2,
    color: 'text-blue-600',
    bg:    'bg-blue-500/10',
    label: 'Enterprise',
    desc:  'For districts and school groups.',
    features: [
      'Everything in Pro',
      'Multiple schools / branches',
      'Custom integrations',
      'Dedicated account manager',
      'Custom SLA & training',
    ],
  },
} as const

type PlanKey = keyof typeof PLAN_META

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(usdAmount: number, currency: string, rates: Record<string, number>) {
  const rate = rates[currency.toLowerCase()] ?? 1
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(usdAmount * rate)
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:    { label: 'Active',    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' },
    trialing:  { label: 'Trial',     className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900' },
    past_due:  { label: 'Past Due',  className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' },
    cancelled: { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900' },
    inactive:  { label: 'Inactive',  className: 'bg-muted text-muted-foreground border-border' },
  }
  const s = map[status] ?? map.inactive
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>
}

// ── Grading Quota Widget ───────────────────────────────────────────────────

function GradingQuotaWidget({
  quota,
  onUpgrade,
  isPending,
}: {
  quota:     GradingQuota
  onUpgrade: () => void
  isPending: boolean
}) {
  if (quota.unlimited) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <Brain className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">
          Unlimited AI grading — no monthly cap on your plan.
        </p>
      </div>
    )
  }

  const used      = quota.used      ?? 0
  const limit     = quota.limit     ?? 3
  const remaining = quota.remaining ?? limit - used
  const pct       = Math.min(Math.round((used / limit) * 100), 100)
  const isExhausted = remaining <= 0
  const isWarning   = remaining === 1

  const resetDate = quota.resets_at
    ? format(new Date(quota.resets_at), 'MMM d, yyyy')
    : null

  return (
    <div className={`rounded-lg border p-3 space-y-2.5 ${
      isExhausted
        ? 'border-rose-200 dark:border-rose-900 bg-rose-500/10'
        : isWarning
          ? 'border-amber-200 dark:border-amber-900 bg-amber-500/10'
          : 'border-border bg-muted'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className={`h-4 w-4 shrink-0 ${
            isExhausted ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-muted-foreground'
          }`} />
          <span className={`text-xs font-semibold ${
            isExhausted ? 'text-rose-700 dark:text-rose-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
          }`}>
            AI Gradings This Month
          </span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${
          isExhausted ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
        }`}>
          {used} / {limit}
        </span>
      </div>

      <div className="h-2 rounded-full bg-white/70 overflow-hidden border border-white">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isExhausted ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs ${
          isExhausted ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
        }`}>
          {isExhausted
            ? `Quota exhausted.${resetDate ? ` Resets ${resetDate}.` : ''}`
            : isWarning
              ? `1 grading remaining this month.`
              : `${remaining} grading${remaining === 1 ? '' : 's'} remaining.${resetDate ? ` Resets ${resetDate}.` : ''}`
          }
        </p>
        {resetDate && (
          <div className="flex items-center gap-1 text-muted-foreground/60 shrink-0">
            <RefreshCw className="h-3 w-3" />
            <span className="text-[10px]">{resetDate}</span>
          </div>
        )}
      </div>

      {(isExhausted || isWarning) && (
        <Button
          size="sm"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white h-7 text-xs"
          onClick={onUpgrade}
          disabled={isPending}
        >
          {isPending
            ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            : <Zap className="mr-1.5 h-3 w-3" />
          }
          {isExhausted ? 'Upgrade for unlimited grading' : 'Upgrade to avoid hitting the limit'}
        </Button>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface BillingClientProps {
  subscription: Subscription | null
  gradingQuota: GradingQuota | null
  error?:       string
}

export function BillingClient({ subscription, gradingQuota, error }: BillingClientProps) {
  const [interval,    setInterval]     = useState<'monthly' | 'annual'>('monthly')
  const [region,      setRegion]       = useState<BillingRegion>('global')
  const [isPending,   startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan]  = useState<string | null>(null)
  const { currency, rates, saving: savingCurrency, setCurrency } = useCurrency()

  const rate = rates[currency.toLowerCase()] ?? 1
  const rateLabel = currency !== 'USD'
    ? `1 USD = ${new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(rate)}`
    : null

  useEffect(() => { setRegion(detectRegion()) }, [])

  const currentPlan = (subscription?.plan ?? 'free') as PlanKey
  const prices      = REGIONAL_PRICES[region]

  const handleUpgrade = (planId: 'pro' | 'enterprise') => {
    if (planId === 'enterprise') {
      window.open('mailto:sales@markapp.io?subject=Enterprise Enquiry', '_blank')
      return
    }
    setLoadingPlan(planId)
    startTransition(async () => {
      const { data, error } = await initializePayment(planId, interval, region)
      if (error || !data?.url) {
        toast.error(error?.message ?? 'Failed to start checkout.')
        setLoadingPlan(null)
        return
      }
      window.location.href = data.url
    })
  }

  const handleManageBilling = () => {
    startTransition(async () => {
      const { data, error } = await createPortalSession()
      if (error || !data?.url) {
        toast.error(error?.message ?? 'Failed to open billing portal.')
        return
      }
      window.location.href = data.url
    })
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="pt-5 flex items-center gap-3 text-rose-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">Failed to load billing details: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const CurrentIcon = PLAN_META[currentPlan].icon

  return (
    <div className="space-y-8">

      {/* ── Current plan card ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {subscription?.current_period_end
                  ? `Renews ${format(new Date(subscription.current_period_end), 'MMM d, yyyy')}`
                  : currentPlan === 'free' ? 'Free forever' : 'No active billing period'
                }
              </CardDescription>
            </div>
            <StatusBadge status={subscription?.status ?? 'inactive'} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${PLAN_META[currentPlan].bg}`}>
              <CurrentIcon className={`h-5 w-5 ${PLAN_META[currentPlan].color}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{PLAN_META[currentPlan].label}</p>
              <p className="text-xs text-muted-foreground">{PLAN_META[currentPlan].desc}</p>
            </div>
          </div>

          {/* Student usage */}
          {subscription && (
            <div className="rounded-lg bg-muted p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium text-foreground">
                  {subscription.student_count} / {subscription.limits.students === Infinity ? '∞' : subscription.limits.students}
                </span>
              </div>
              {subscription.limits.students < Infinity && (
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (subscription.student_count / subscription.limits.students) * 100, 100,
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Grading quota widget */}
          {gradingQuota && (
            <GradingQuotaWidget
              quota={gradingQuota}
              onUpgrade={() => handleUpgrade('pro')}
              isPending={isPending}
            />
          )}

          {/* Past due warning */}
          {subscription?.status === 'past_due' && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-500/10 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-amber-700">
                  Your last payment failed. Update your payment method to keep access.
                </p>
                <Button variant="link" size="sm"
                  className="h-auto p-0 mt-1 text-xs text-amber-700 underline"
                  onClick={handleManageBilling} disabled={isPending}
                >
                  Update payment method →
                </Button>
              </div>
            </div>
          )}

          {currentPlan !== 'free' && (
            <Button variant="outline" size="sm" onClick={handleManageBilling}
              disabled={isPending} className="gap-2"
            >
              {isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Settings className="h-3.5 w-3.5" />
              }
              Manage Billing
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Currency preferences ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <Coins className="h-4 w-4 text-gold" />
            </div>
            <div>
              <CardTitle className="text-base">Display Currency</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Sets the default currency across School Hub and all revenue views.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">System currency</p>
              {rateLabel ? (
                <p className="text-xs text-muted-foreground">{rateLabel} · live rate</p>
              ) : (
                <p className="text-xs text-muted-foreground">Base currency — no conversion applied.</p>
              )}
            </div>
            <Select value={currency} onValueChange={setCurrency} disabled={savingCurrency}>
              <SelectTrigger className="w-44 h-9 text-sm">
                {savingCurrency
                  ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
                  : <SelectValue />
                }
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code} className="text-sm">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground/60">
            All monetary values in School Hub are stored in USD and converted using live exchange rates updated hourly.
          </p>
        </CardContent>
      </Card>

      {/* ── Plan selector ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Available Plans</h3>
          {region === 'east_africa' && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
              <MapPin className="h-3 w-3 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">East Africa pricing applied</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRegion(r => r === 'global' ? 'east_africa' : 'global')}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {region === 'east_africa' ? 'Switch to global pricing' : 'In East Africa?'}
          </button>

          <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
            {(['monthly', 'annual'] as const).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  interval === i
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {i === 'monthly' ? 'Monthly' : 'Annual'}
                {i === 'annual' && (
                  <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    -25%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Plan cards ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(['free', 'pro', 'enterprise'] as const).map((planId) => {
          const meta      = PLAN_META[planId]
          const Icon      = meta.icon
          const isCurrent = planId === currentPlan
          const loading   = loadingPlan === planId && isPending

          return (
            <Card
              key={planId}
              className={`relative flex flex-col ${'popular' in meta && meta.popular
                ? 'border-amber-300 shadow-md shadow-amber-100' : ''
              } ${isCurrent ? 'ring-2 ring-primary/20' : ''}`}
            >
              {'popular' in meta && meta.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.bg} mb-2`}>
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                </div>
                <CardTitle className="text-base">{meta.label}</CardTitle>

                <div className="mt-1">
                  {planId === 'free' && (
                    <p className="text-2xl font-bold text-foreground">Free</p>
                  )}
                  {planId === 'pro' && (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          {fmt(interval === 'monthly' ? prices.monthly : prices.annualMonthly, currency, rates)}
                        </span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                        {interval === 'annual' && (
                          <span className="text-xs text-muted-foreground/60 line-through ml-1">
                            {fmt(prices.monthly, currency, rates)}
                          </span>
                        )}
                      </div>
                      {interval === 'annual' && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Billed {fmt(prices.annual, currency, rates)}/yr
                        </p>
                      )}
                    </>
                  )}
                  {planId === 'enterprise' && (
                    <p className="text-2xl font-bold text-foreground">Custom</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                <ul className="space-y-1.5 flex-1">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Separator />

                {isCurrent ? (
                  <Button variant="outline" size="sm" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : planId === 'free' ? (
                  <Button variant="outline" size="sm" disabled className="w-full text-muted-foreground">
                    Downgrade via Portal
                  </Button>
                ) : planId === 'enterprise' ? (
                  <Button variant="outline" size="sm"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => handleUpgrade('enterprise')}
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Contact Sales
                  </Button>
                ) : (
                  <Button size="sm"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleUpgrade('pro')}
                    disabled={isPending}
                  >
                    {loading
                      ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      : <Zap className="mr-2 h-3.5 w-3.5" />
                    }
                    Upgrade to Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="text-xs text-center text-muted-foreground/60">
        Payments processed securely by Stripe. Cancel anytime from the billing portal.
        {region === 'east_africa' && ' East Africa regional pricing automatically applied.'}
      </p>
    </div>
  )
}