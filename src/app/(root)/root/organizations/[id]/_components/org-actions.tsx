'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { suspendOrganization, activateOrganization } from '@/lib/actions/root'

export function OrgActions({ orgId, isActive }: { orgId: string; isActive: boolean }) {
  const router              = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmed, setConfirmed]  = useState(false)

  const handleToggle = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setConfirmed(false)
    startTransition(async () => {
      const { error } = isActive
        ? await suspendOrganization(orgId)
        : await activateOrganization(orgId)

      if (error) {
        toast.error('Action failed', { description: error.message })
      } else {
        toast.success(isActive ? 'Organization suspended' : 'Organization activated')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {confirmed && (
        <span className="text-xs" style={{ color: '#facc15' }}>
          Click again to confirm
        </span>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={handleToggle}
        onBlur={() => setConfirmed(false)}
        className="gap-1.5 text-xs"
        style={isActive
          ? { borderColor: 'rgba(239,68,68,0.4)', color: '#f87171', background: 'rgba(239,68,68,0.06)' }
          : { borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80', background: 'rgba(34,197,94,0.06)' }
        }
      >
        {isActive
          ? <><ShieldOff className="h-3.5 w-3.5" />{pending ? 'Suspending…' : 'Suspend org'}</>
          : <><ShieldCheck className="h-3.5 w-3.5" />{pending ? 'Activating…' : 'Activate org'}</>
        }
      </Button>
    </div>
  )
}
