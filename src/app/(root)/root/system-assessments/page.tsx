import { Metadata } from 'next'
import { getSystemAssessments } from '@/lib/actions/root'
import { ShieldCheck } from 'lucide-react'
import { AssessmentActions } from './_components/assessment-actions'

export const metadata: Metadata = { title: 'System Content — Mark Platform' }

export default async function SystemAssessmentsPage() {
  const { data: assessments, error } = await getSystemAssessments()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Assessments</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Platform-seeded assessments. Toggle publish and org visibility below.
        </p>
      </div>

      {error && (
        <p className="text-sm" style={{ color: '#f87171' }}>{error.message}</p>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Title</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Audit status</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Created</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(assessments ?? []).map(a => (
              <tr key={a.assessment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-3 text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: '#c9a84c' }} />
                  {a.title}
                </td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{a.audit_status ?? '—'}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <AssessmentActions
                    id={a.assessment_id}
                    isPublished={a.is_published}
                    isVisible={(a as any).is_visible_to_orgs ?? false}
                  />
                </td>
              </tr>
            ))}
            {(assessments ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No system assessments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
