import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { FlaskConical } from 'lucide-react'
import { getSession } from '@/lib/session'
import { getRootCurricula } from '@/lib/actions/root'
import {
  getQualityScorecard,
  listQualityConversations,
} from '@/lib/actions/quality-eval'
import { TutoringQualityClient } from './tutoring-quality-client'

export const metadata: Metadata = { title: 'Tutoring Quality — Mark Platform' }

export default async function TutoringQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ curriculum_id?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  const role = (session as { role?: string }).role
  if (role !== 'Root' && role !== 'Support') redirect('/root')

  const params = await searchParams
  const { data: curricula } = await getRootCurricula()

  const available = (curricula ?? []).filter((c) => c.kind === 'enriched')
  const selectedId = params.curriculum_id ?? available[0]?.schema_id ?? ''

  const [{ data: scorecard }, { data: conversations }] = selectedId
    ? await Promise.all([
        getQualityScorecard(selectedId),
        listQualityConversations(selectedId),
      ])
    : [{ data: null }, { data: null }]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(201,168,76,0.15)' }}
        >
          <FlaskConical className="h-5 w-5" style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tutoring Quality</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Comprendo-style benchmark — a simulated student holding a real planted
            misconception talks to Tracy&apos;s live endpoint, scored by an independent judge.
          </p>
        </div>
      </div>

      <TutoringQualityClient
        curricula={available}
        selectedId={selectedId}
        scorecard={scorecard ?? null}
        conversations={conversations ?? []}
      />
    </div>
  )
}
