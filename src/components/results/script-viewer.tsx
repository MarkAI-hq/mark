'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ScriptViewerProps {
  scriptUrl:          string | null
  annotatedScriptUrl?: string | null
}

export function ScriptViewer({ scriptUrl, annotatedScriptUrl }: ScriptViewerProps) {
  // Default to marked view if annotation is available, otherwise original
  const [view, setView] = useState<'original' | 'marked'>(
    annotatedScriptUrl ? 'marked' : 'original',
  )

  const activeUrl = view === 'marked' && annotatedScriptUrl
    ? annotatedScriptUrl
    : scriptUrl

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Student Submission</CardTitle>

          {/* Only show toggle if an annotated version exists */}
          {annotatedScriptUrl && (
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setView('original')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'original'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-muted-foreground hover:text-gray-700'
                }`}
              >
                <FileText size={12} />
                Original
              </button>
              <button
                onClick={() => setView('marked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'marked'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-muted-foreground hover:text-gray-700'
                }`}
              >
                <CheckCircle2 size={12} className="text-green-600" />
                Marked
              </button>
            </div>
          )}

          {/* Show a subtle badge when annotation is still processing */}
          {!annotatedScriptUrl && scriptUrl && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Marking pending...
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="h-[calc(100%-4.5rem)]">
        {activeUrl ? (
          <iframe
            key={activeUrl}  // force remount when URL switches so PDF reloads cleanly
            src={activeUrl}
            className="w-full h-full rounded-md border"
            title={view === 'marked' ? 'Marked Script' : 'Student Submission Script'}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground bg-muted/40 rounded-lg border">
            <div>
              <Alert variant="default" className="max-w-sm mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Script Found</AlertTitle>
                <AlertDescription>
                  An answer script was not found for this submission.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}