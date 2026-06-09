'use client'

import { TrendingUp, Users, Award, DollarSign, FileCheck, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SchoolStats, SchoolEarnings, EarningsByType } from '@/lib/actions/school-revenue'
import type { SchoolExtraWithStats } from '@/lib/actions/extras'
import type { ExamRegistration } from '@/lib/actions/exam-registrations'
import { CURRENCIES } from '@/config/currencies'
import { useCurrency } from '@/components/providers/currency-provider'

const TYPE_LABELS: Record<string, string> = {
  certificate:       'Certificates',
  extra:             'Extras',
  transfer:          'Transfers',
  exam_registration: 'Exam Registrations',
}

interface Props {
  stats:             SchoolStats | null
  earnings:          SchoolEarnings | null
  examRegistrations: ExamRegistration[]
  extras:            SchoolExtraWithStats[]
}

function convert(usdAmount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency.toLowerCase()] ?? 1
  return usdAmount * rate
}

function fmt(usdAmount: number, currency: string, rates: Record<string, number>) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(convert(usdAmount, currency, rates))
}

function StatCard({
  title, value, sub, icon: Icon, className = '',
}: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PartnerDashboardClient({ stats, earnings, examRegistrations, extras }: Props) {
  const { currency, rates, saving, setCurrency } = useCurrency()

  const rate = rates[currency.toLowerCase()] ?? 1
  const isUsd = currency === 'USD'
  const rateLabel = isUsd ? null : `1 USD = ${new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(rate)}`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">School Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue, registrations, and school metrics.</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Currency</span>
            <Select value={currency} onValueChange={setCurrency} disabled={saving}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {rateLabel && (
            <span className="text-[10px] text-muted-foreground">{rateLabel} · live rate</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Students"
          value={stats?.student_count ?? 0}
          sub="Enrolled"
          icon={Users}
        />
        <StatCard
          title="Certificates"
          value={stats?.certificates_issued ?? 0}
          sub="Issued"
          icon={Award}
        />
        <StatCard
          title="Total Revenue"
          value={fmt(stats?.total_gross_usd ?? 0, currency, rates)}
          sub="Gross processed"
          icon={TrendingUp}
          className="border-gold/20 bg-gold/5"
        />
        <StatCard
          title="Your Share"
          value={fmt(stats?.total_school_revenue_usd ?? 0, currency, rates)}
          sub="After Mirror fees"
          icon={DollarSign}
          className="border-gold/20 bg-gold/5"
        />
      </div>

      <Tabs defaultValue="earnings">
        <TabsList>
          <TabsTrigger value="earnings">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="exams">Exam Registrations</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
        </TabsList>

        {/* Revenue breakdown */}
        <TabsContent value="earnings" className="mt-4 space-y-3">
          {!earnings?.by_type?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            earnings.by_type.map((row: EarningsByType) => (
              <Card key={row.transaction_type}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{TYPE_LABELS[row.transaction_type] ?? row.transaction_type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.count} transaction{row.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {fmt(Number(row.total_school_cut ?? 0), currency, rates)}{' '}
                        <span className="text-xs text-muted-foreground font-normal">your share</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(Number(row.total_gross ?? 0), currency, rates)} gross
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Exam registrations */}
        <TabsContent value="exams" className="mt-4 space-y-3">
          {examRegistrations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No exam registrations yet.</p>
              </CardContent>
            </Card>
          ) : (
            examRegistrations.map((reg: any) => (
              <Card key={reg.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{reg.exam_body} — {reg.exam_type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[reg.student_name, reg.student_last].filter(Boolean).join(' ')}
                        {reg.exam_session ? ` · ${reg.exam_session}` : ''}
                      </p>
                      {reg.registration_number && (
                        <p className="text-xs font-mono text-muted-foreground">Ref: {reg.registration_number}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{fmt(Number(reg.fee_usd), currency, rates)}</span>
                      <Badge className={
                        reg.status === 'registered' ? 'bg-gold/10 text-gold' :
                        reg.status === 'paid'       ? 'bg-blue-100 text-blue-700' :
                                                      'bg-amber-100 text-amber-700'
                      }>
                        {reg.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Extras */}
        <TabsContent value="extras" className="mt-4 space-y-3">
          {extras.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No extras created yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage extras from the Extras page in your dashboard.
                </p>
              </CardContent>
            </Card>
          ) : (
            extras.map((extra: SchoolExtraWithStats) => (
              <Card key={extra.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{extra.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{extra.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 gap-1">
                        <Users className="h-3 w-3" />
                        {extra.enrollment_count} enrolled
                      </Badge>
                      {extra.is_free ? (
                        <Badge variant="outline" className="text-gold border-gold/30">Free</Badge>
                      ) : (
                        <span className="text-sm font-semibold">{fmt(Number(extra.price_usd), currency, rates)}</span>
                      )}
                      <Badge variant={extra.is_active ? 'default' : 'secondary'}>
                        {extra.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
