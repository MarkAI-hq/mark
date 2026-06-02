'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, BookOpen, Globe, Layers, FileText } from 'lucide-react'
import type { CurriculumSummary } from '@/lib/actions/root'
import { CreateCurriculumDrawer } from './create-curriculum-drawer'

// ── helpers ──────────────────────────────────────────────────────────────────

function displayCountry(raw: string): string {
  const map: Record<string, string> = {
    ug: 'Uganda', ke: 'Kenya', ng: 'Nigeria', tz: 'Tanzania', rw: 'Rwanda',
    gh: 'Ghana',  zm: 'Zambia', zw: 'Zimbabwe',
  }
  return map[raw?.toLowerCase()] ?? raw
}

function countryFlag(raw: string): string {
  const map: Record<string, string> = {
    ug: '🇺🇬', ke: '🇰🇪', ng: '🇳🇬', tz: '🇹🇿', rw: '🇷🇼',
    gh: '🇬🇭', zm: '🇿🇲', zw: '🇿🇼',
  }
  return map[raw?.toLowerCase()] ?? '🌍'
}

function bodyColor(body: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    ple:  { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
    uce:  { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80' },
    uace: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
    kcpe: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
    kcse: { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80' },
  }
  return map[body?.toLowerCase()] ?? { bg: 'rgba(201,168,76,0.12)', text: '#c9a84c' }
}

// ── types ─────────────────────────────────────────────────────────────────────

interface Group {
  country:         string
  curriculum_body: string
  items:           CurriculumSummary[]
}

// ── component ─────────────────────────────────────────────────────────────────

export function CurriculaBrowser({ curricula }: { curricula: CurriculumSummary[] }) {
  const [countryFilter, setCountryFilter]  = useState<string | null>(null)
  const [bodyFilter,    setBodyFilter]     = useState<string | null>(null)
  const [collapsed,     setCollapsed]      = useState<Set<string>>(new Set())

  // Unique filter options
  const countries = useMemo(
    () => [...new Set(curricula.map(c => c.country))].sort(),
    [curricula],
  )
  const bodies = useMemo(
    () => [...new Set(
      curricula
        .filter(c => !countryFilter || c.country === countryFilter)
        .map(c => c.curriculum_body),
    )].sort(),
    [curricula, countryFilter],
  )

  // Filtered + grouped
  const groups: Group[] = useMemo(() => {
    const filtered = curricula.filter(c =>
      (!countryFilter || c.country === countryFilter) &&
      (!bodyFilter    || c.curriculum_body === bodyFilter),
    )

    const map = new Map<string, Group>()
    for (const item of filtered) {
      const key = `${item.country}||${item.curriculum_body}`
      if (!map.has(key)) {
        map.set(key, { country: item.country, curriculum_body: item.curriculum_body, items: [] })
      }
      map.get(key)!.items.push(item)
    }

    return [...map.values()].sort((a, b) =>
      a.country.localeCompare(b.country) || a.curriculum_body.localeCompare(b.curriculum_body),
    )
  }, [curricula, countryFilter, bodyFilter])

  const toggleGroup = (key: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const clearFilters = () => { setCountryFilter(null); setBodyFilter(null) }

  const totalShown = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="space-y-5">

      {/* Header row: stats + create button */}
      <div className="flex items-center justify-between gap-4">
        <CreateCurriculumDrawer />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6">
        <Stat icon={FileText}  label="Total schemas" value={curricula.length} />
        <Stat icon={Globe}     label="Countries"     value={countries.length} />
        <Stat icon={Layers}    label="Curriculum types" value={[...new Set(curricula.map(c => c.curriculum_body))].length} />
        <Stat icon={BookOpen}  label="Subjects"      value={[...new Set(curricula.map(c => c.subject))].length} />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Country pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium shrink-0" style={{ color: 'rgba(255,255,255,0.35)', width: 80 }}>Country</span>
          <FilterPill label="All" active={!countryFilter} onClick={() => { setCountryFilter(null); setBodyFilter(null) }} />
          {countries.map(c => (
            <FilterPill
              key={c}
              label={`${countryFlag(c)} ${displayCountry(c)}`}
              active={countryFilter === c}
              onClick={() => { setCountryFilter(c); setBodyFilter(null) }}
            />
          ))}
        </div>

        {/* Curriculum body pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium shrink-0" style={{ color: 'rgba(255,255,255,0.35)', width: 80 }}>Type</span>
          <FilterPill label="All" active={!bodyFilter} onClick={() => setBodyFilter(null)} />
          {bodies.map(b => {
            const { bg, text } = bodyColor(b)
            return (
              <FilterPill
                key={b}
                label={b?.toUpperCase()}
                active={bodyFilter === b}
                activeStyle={{ background: bg, color: text, borderColor: text + '40' }}
                onClick={() => setBodyFilter(bodyFilter === b ? null : b)}
              />
            )
          })}
        </div>
      </div>

      {/* Results summary */}
      {(countryFilter || bodyFilter) && (
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {totalShown} schema{totalShown !== 1 ? 's' : ''} matching filter
          </span>
          <button
            onClick={clearFilters}
            className="text-xs underline"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Grouped list */}
      {groups.length === 0 ? (
        <div
          className="rounded-xl py-12 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No curricula match the current filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const key = `${group.country}||${group.curriculum_body}`
            const open = !collapsed.has(key)
            const { bg, text } = bodyColor(group.curriculum_body)

            return (
              <div
                key={key}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Group header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                  onClick={() => toggleGroup(key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{countryFlag(group.country)}</span>
                    <span className="text-sm font-semibold text-white">
                      {displayCountry(group.country)}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: bg, color: text }}
                    >
                      {group.curriculum_body?.toUpperCase()}
                    </span>
                    {group.items[0]?.curriculum_level && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {group.items[0].curriculum_level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      {group.items.length} subject{group.items.length !== 1 ? 's' : ''}
                    </span>
                    {open
                      ? <ChevronDown  className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      : <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    }
                  </div>
                </button>

                {/* Subject rows */}
                {open && (
                  <div>
                    {group.items
                      .sort((a, b) => a.subject?.localeCompare(b.subject ?? '') ?? 0)
                      .map((c, idx) => (
                        <div
                          key={c.schema_id}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                          style={{
                            borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <span className="text-sm font-medium text-white truncate">{c.subject}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              v{c.version}
                            </span>
                            <StatusBadge status={c.status} />
                            <Link
                              href={`/root/curricula/${encodeURIComponent(c.schema_id)}`}
                              className="text-xs rounded px-2.5 py-1 font-medium transition-colors hover:opacity-80"
                              style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" style={{ color: '#c9a84c' }} />
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
    </div>
  )
}

function FilterPill({
  label,
  active,
  onClick,
  activeStyle,
}: {
  label:       string
  active:      boolean
  onClick:     () => void
  activeStyle?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs rounded-full px-3 py-1 transition-all font-medium"
      style={active
        ? (activeStyle ?? { background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' })
        : { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
      }
    >
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
      style={{
        background: active ? 'rgba(34,197,94,0.1)'   : 'rgba(255,255,255,0.06)',
        color:      active ? '#4ade80'                : 'rgba(255,255,255,0.4)',
      }}
    >
      {status ?? 'unknown'}
    </span>
  )
}
