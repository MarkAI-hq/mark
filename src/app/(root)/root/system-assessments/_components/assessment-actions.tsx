'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { publishSystemAssessment, setSystemAssessmentVisibility } from '@/lib/actions/root'

export function AssessmentActions({
  id,
  isPublished,
  isVisible,
}: {
  id:          string
  isPublished: boolean
  isVisible:   boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const toggle = (action: 'publish' | 'visibility') => {
    start(async () => {
      const res = action === 'publish'
        ? await publishSystemAssessment(id, !isPublished)
        : await setSystemAssessmentVisibility(id, !isVisible)

      if (res.error) {
        toast.error('Failed', { description: res.error.message })
      } else {
        toast.success(action === 'publish'
          ? (isPublished ? 'Unpublished' : 'Published')
          : (isVisible ? 'Hidden from orgs' : 'Visible to orgs'),
        )
        router.refresh()
      }
    })
  }

  const btn = (label: string, active: boolean, action: 'publish' | 'visibility') => (
    <button
      onClick={() => toggle(action)}
      disabled={pending}
      className="inline-flex items-center rounded px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
      style={{
        background: active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
        color:      active ? '#4ade80' : 'rgba(255,255,255,0.5)',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center gap-2">
      {btn(isPublished ? 'Published' : 'Draft', isPublished, 'publish')}
      {btn(isVisible ? 'Visible to orgs' : 'Hidden', isVisible, 'visibility')}
    </div>
  )
}
