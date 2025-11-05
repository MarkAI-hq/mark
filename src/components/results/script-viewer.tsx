'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ScriptViewerProps {
  scriptUrl: string | null
}

export function ScriptViewer({ scriptUrl }: ScriptViewerProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Student Submission</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        {scriptUrl ? (
          <iframe
            src={scriptUrl}
            className="w-full h-full rounded-md border"
            title="Student Submission Script"
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
