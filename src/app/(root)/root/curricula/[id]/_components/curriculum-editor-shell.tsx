'use client'

import { useState } from 'react'
import { Edit3, Wand2, History } from 'lucide-react'
import { CurriculumEditor } from './curriculum-editor'
import { AiFillPanel } from './ai-fill-panel'
import { VersionHistoryPanel } from './version-history-panel'
import type { CurriculumSchemaVersion } from '@/lib/actions/root'

type Tab = 'edit' | 'ai-fill' | 'versions'

function deepMerge(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(patch)) {
    const pv = patch[key]
    const tv = target[key]
    if (
      pv &&
      typeof pv === 'object' &&
      !Array.isArray(pv) &&
      tv &&
      typeof tv === 'object' &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(
        tv as Record<string, unknown>,
        pv as Record<string, unknown>,
      )
    } else {
      result[key] = pv
    }
  }
  return result
}

export function CurriculumEditorShell({
  schemaId,
  initialData,
  versions,
}: {
  schemaId:    string
  initialData: Record<string, unknown>
  versions:    CurriculumSchemaVersion[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('edit')
  const [raw, setRaw]             = useState(JSON.stringify(initialData, null, 2))

  const handleApplyPatch = (patch: Record<string, unknown>) => {
    try {
      const current = JSON.parse(raw) as Record<string, unknown>
      const merged  = deepMerge(current, patch)
      setRaw(JSON.stringify(merged, null, 2))
      setActiveTab('edit')
    } catch {
      // raw is invalid JSON at this point — just switch to edit so user sees it
      setActiveTab('edit')
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'edit',     label: 'Edit',            icon: Edit3 },
    { id: 'ai-fill',  label: 'AI Fill',          icon: Wand2 },
    { id: 'versions', label: 'Version History',  icon: History, badge: versions.length },
  ]

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {tabs.map(t => {
          const active = activeTab === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all"
              style={active
                ? { background: 'rgba(255,255,255,0.08)', color: 'white' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.45)' }
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[16px] h-4 px-1"
                  style={{
                    background: active ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)',
                    color:      active ? '#c9a84c'                : 'rgba(255,255,255,0.4)',
                    fontSize: '10px',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      {activeTab === 'edit' && (
        <CurriculumEditor
          schemaId={schemaId}
          raw={raw}
          onRawChange={setRaw}
        />
      )}

      {activeTab === 'ai-fill' && (
        <AiFillPanel
          schemaId={schemaId}
          onApplyPatch={handleApplyPatch}
        />
      )}

      {activeTab === 'versions' && (
        <VersionHistoryPanel
          schemaId={schemaId}
          versions={versions}
        />
      )}
    </div>
  )
}
