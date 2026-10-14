// src/components/exams/exam-builder-wizard.tsx
'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArchetypeDetectionCard } from './archetype-detection-card'
import { GenerationConfigForm } from './generation-config-form'
import { ExamDetectionResult } from '@/lib/types'

export function ExamBuilderWizard() {
  const [step, setStep] = useState(1)
  const [detection, setDetection] = useState<ExamDetectionResult | null>(null)
  const [sourceText, setSourceText] = useState("")

  if (step === 1) {
    return (
      <ArchetypeDetectionCard 
        onDetected={(res, text) => {
          setDetection(res)
          setSourceText(text)
          setStep(2)
        }} 
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="link"
        size="sm"
        className="mb-4 h-auto gap-1.5 p-0 text-primary"
        onClick={() => setStep(1)}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Start over / Upload different file
      </Button>
      {detection && (
        <GenerationConfigForm 
          detection={detection} 
          sourceContent={sourceText} 
        />
      )}
    </div>
  )
}