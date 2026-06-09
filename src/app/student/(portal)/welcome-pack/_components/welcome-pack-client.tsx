'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Package, Truck, CheckCircle, Clock, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { orderWelcomePack, WelcomePackOrder, ShippingAddress } from '@/lib/actions/welcome-pack'

interface Props {
  user: any
  orders: WelcomePackOrder[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800',    icon: Package },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800',   icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-600',     icon: Clock },
}

export function WelcomePackClient({ user, orders }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [address, setAddress] = useState<ShippingAddress>({
    name: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
    line1: '',
    line2: '',
    city: '',
    country: '',
    postal_code: '',
  })

  const activeOrder = orders.find((o) => o.status !== 'cancelled')

  async function handleOrder() {
    if (!address.name || !address.line1 || !address.city || !address.country || !address.postal_code) {
      toast.error('Please fill in all required shipping fields.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await orderWelcomePack(address)
      if (error || !data?.checkout_url) {
        toast.error(error?.message ?? 'Failed to initiate order.')
        return
      }
      window.location.href = data.checkout_url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gold flex items-center justify-center">
          <Gift className="h-6 w-6 text-gold-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Welcome Pack</h1>
          <p className="text-sm text-muted-foreground">Your physical Mark starter kit — $25 delivered</p>
        </div>
      </div>

      {/* Pack contents info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['Mark branded notebook', 'Revision flashcard set', 'Sticker pack', 'Study schedule poster', 'Personalised welcome letter', 'Progress tracker'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing order */}
      {activeOrder ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {(() => {
                const cfg = STATUS_CONFIG[activeOrder.status] ?? STATUS_CONFIG.pending
                const Icon = cfg.icon
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                )
              })()}
            </div>
            {activeOrder.tracking_number && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tracking</span>
                <span className="text-sm font-mono">{activeOrder.tracking_number}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order date</span>
              <span className="text-sm">
                {activeOrder.ordered_at
                  ? new Date(activeOrder.ordered_at).toLocaleDateString()
                  : new Date(activeOrder.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {!showForm ? (
            <Button
              className="w-full" variant="gold"
              size="lg"
              onClick={() => setShowForm(true)}
            >
              Order My Welcome Pack — $25
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Full Name *</Label>
                  <Input
                    value={address.name}
                    onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={address.line1}
                    onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Address Line 2</Label>
                  <Input
                    value={address.line2}
                    onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>City *</Label>
                    <Input
                      value={address.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      placeholder="Nairobi"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Postal Code *</Label>
                    <Input
                      value={address.postal_code}
                      onChange={(e) => setAddress((a) => ({ ...a, postal_code: e.target.value }))}
                      placeholder="00100"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Country *</Label>
                  <Input
                    value={address.country}
                    onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                    placeholder="Kenya"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    variant="gold"
                    onClick={handleOrder}
                    disabled={loading}
                  >
                    {loading ? 'Redirecting...' : 'Pay $25 & Order'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
