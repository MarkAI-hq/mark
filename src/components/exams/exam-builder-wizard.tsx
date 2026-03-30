// src/components/exams/exam-builder-wizard.tsx
'use client'

import { useState } from 'react'
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
      <button 
        onClick={() => setStep(1)} 
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        &larr; Start over / Upload different file
      </button>
      {detection && (
        <GenerationConfigForm 
          detection={detection} 
          sourceContent={sourceText} 
        />
      )}
    </div>
  )
}