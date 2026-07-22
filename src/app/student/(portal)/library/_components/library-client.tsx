'use client'

import { useState, useTransition, type ElementType } from 'react'
import { Search, BookOpen, FileText, Video, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getLibraryResources, type LibraryResource } from '@/lib/actions/library'

const TYPE_ICON: Record<LibraryResource['resource_type'], ElementType> = {
  book: BookOpen,
  pdf: FileText,
  video: Video,
  link: LinkIcon,
}

export function LibraryClient({ initial, error }: { initial: LibraryResource[]; error: string | null }) {
  const [resources, setResources] = useState(initial)
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  function search(q: string) {
    setQuery(q)
    startTransition(async () => {
      const { data } = await getLibraryResources({ q: q || undefined })
      if (data) setResources(data)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Library</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Books, guides, and resources curated for your studies.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search the library…" value={query} onChange={(e) => search(e.target.value)} />
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {isPending ? 'Searching…' : 'No resources found yet.'}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {resources.map((r) => {
            const Icon = TYPE_ICON[r.resource_type] ?? BookOpen
            const href = r.external_url ?? r.file_url ?? '#'
            return (
              <a key={r.id} href={href} target="_blank" rel="noreferrer">
                <Card className="h-full hover:border-gold/40 transition-colors">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Icon className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
