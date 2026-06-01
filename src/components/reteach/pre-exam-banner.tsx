'use client'

// src/components/reteach/pre-exam-banner.tsx
// E3: Banner shown on assessment page when there are undelivered reteach sessions
// covering topics in this assessment. Teachers should deliver these before publishing.

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Zap } from 'lucide-react'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { getPreExamCheck, type PreExamCheckItem } from '@/lib/actions/reteach'

interface PreExamBannerProps {
  assessmentId: string
  classId?:     string
}

export function PreExamBanner({ assessmentId, classId }: PreExamBannerProps) {
  const [items,    setItems]    = useState<PreExamCheckItem[]>([])
  const [expanded, setExpanded] = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getPreExamCheck(assessmentId).then(({ data }) => {
      setItems(data ?? [])
      setLoading(false)
    })
  }, [assessmentId])

  if (loading || !items.length) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            {items.length} undelivered intervention{items.length !== 1 ? 's' : ''} cover topics in this assessment
          </span>
          <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
            Deliver before assessing
          </Badge>
        </div>
        {expanded
          ? <ChevronDown  className="h-4 w-4 text-amber-500 shrink-0" />
          : <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-amber-200 divide-y divide-amber-100">
          {items.map((item) => (
            <div key={item.session_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-800 truncate">{item.error_type}</p>
                {item.topic && (
                  <p className="text-[10px] text-amber-600">Topic: {item.topic}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                  {item.scope}
                </Badge>
                {classId ? (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-amber-300 text-amber-800 hover:bg-amber-100" asChild>
                    <Link href={`/dashboard/classes/${classId}?tab=interventions`}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                ) : (
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
