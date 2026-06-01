'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { reloadCurriculaFromFiles } from '@/lib/actions/root'

export function ReloadButton() {
  const router = useRouter()
  const [pending, start] = useTransition()

  const reload = () => {
    start(async () => {
      const { data, error } = await reloadCurriculaFromFiles()
      if (error) {
        toast.error('Reload failed', { description: error.message })
      } else {
        toast.success(`Loaded ${data?.loaded ?? 0} schemas from files`)
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={reload}
      disabled={pending}
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} />
      Reload from files
    </button>
  )
}
