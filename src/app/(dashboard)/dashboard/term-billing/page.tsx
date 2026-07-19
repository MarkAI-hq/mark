import { Metadata } from 'next'
import Link from 'next/link'
import { Wallet, ChevronRight } from 'lucide-react'
import { listTermBillingAdmin } from '@/lib/actions/term-billing'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Term Billing' }

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  awaiting_first: { label: 'Awaiting 1st payment', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  locked: { label: 'Locked', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  refunded: { label: 'Refunded', variant: 'outline' },
}

export default async function TermBillingAdminPage() {
  const { data: rows, error } = await listTermBillingAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Term Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          2-installment term-fee plans — status, deadlines, and payment history.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {(!rows || rows.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-20 text-center">
          <Wallet className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No term-billing plans yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Plans appear once term billing is enabled and a student&apos;s payment starts.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Term fee</th>
                  <th className="px-4 py-3 font-medium">2nd installment deadline</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rows.map((row) => {
                  const { label, variant } = STATUS_BADGE[row.status] ?? STATUS_BADGE.awaiting_first
                  return (
                    <tr key={row.plan_id} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant} className="text-xs">{label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        UGX {row.amount_ugx.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.second_installment_deadline
                          ? new Date(row.second_installment_deadline).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/term-billing/${row.plan_id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#926C15] hover:underline"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </Link>
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
