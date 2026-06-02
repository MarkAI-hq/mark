'use client'

import { useState, useTransition, useRef } from 'react'
import { Upload, Wand2, CheckCircle, ChevronDown, ChevronRight, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { aiSuggestFill } from '@/lib/actions/root'
import type { AiFillResult } from '@/lib/actions/root'

type Step = 'upload' | 'processing' | 'review'

export function AiFillPanel({
  schemaId,
  onApplyPatch,
}: {
  schemaId:      string
  onApplyPatch:  (patch: Record<string, unknown>) => void
}) {
  const fileRef                   = useRef<HTMLInputElement>(null)
  const [step, setStep]           = useState<Step>('upload')
  const [pending, start]          = useTransition()
  const [result, setResult]       = useState<AiFillResult | null>(null)
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file')
  const [fileUrl, setFileUrl]     = useState('')
  const [instructions, setInstructions] = useState('')
  const [patchOpen, setPatchOpen] = useState(false)

  const handleFileSubmit = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Select a file first'); return }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and DOCX files are supported')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      runAiFill({ file_base64: base64, mime_type: file.type })
    }
    reader.readAsDataURL(file)
  }

  const handleUrlSubmit = () => {
    if (!fileUrl.trim()) { toast.error('Enter a file URL'); return }
    runAiFill({ file_url: fileUrl.trim(), mime_type: 'application/pdf' })
  }

  const runAiFill = (payload: { file_base64?: string; file_url?: string; mime_type: string }) => {
    setStep('processing')
    start(async () => {
      const { data, error } = await aiSuggestFill(schemaId, {
        ...payload,
        instructions: instructions.trim() || undefined,
      })

      if (error) {
        toast.error('AI fill failed', { description: error.message })
        setStep('upload')
        return
      }

      setResult(data!)
      setStep('review')
    })
  }

  const handleApply = () => {
    if (!result) return
    onApplyPatch(result.proposed_patch)
    toast.success('Patch applied to editor — review and save when ready')
  }

  const reset = () => {
    setStep('upload')
    setResult(null)
    setFileUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-sm font-semibold text-white">AI Fill from Syllabus</h2>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Upload a PDF or DOCX syllabus and AI will propose a schema patch. You review it before applying.
        </p>
      </div>

      {/* Step: upload */}
      {step === 'upload' && (
        <div className="space-y-5">
          {/* Input mode toggle */}
          <div className="flex gap-2">
            <ModeButton active={inputMode === 'file'} onClick={() => setInputMode('file')}>
              <Upload className="h-3.5 w-3.5" /> Upload file
            </ModeButton>
            <ModeButton active={inputMode === 'url'} onClick={() => setInputMode('url')}>
              <Link2 className="h-3.5 w-3.5" /> File URL
            </ModeButton>
          </div>

          {inputMode === 'file' ? (
            <div
              className="rounded-xl p-6 text-center cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ border: '2px dashed rgba(255,255,255,0.1)' }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <p className="text-sm text-white">Click to select PDF or DOCX</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Max recommended: 10 MB</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                File URL (PDF/DOCX already uploaded to storage)
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Instructions <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Focus on extracting topics and paper structure. Ignore section 5."
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <button
            onClick={inputMode === 'file' ? handleFileSubmit : handleUrlSubmit}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            style={{ background: '#c9a84c', color: '#08080f' }}
          >
            <Wand2 className="h-4 w-4" />
            Generate patch
          </button>
        </div>
      )}

      {/* Step: processing */}
      {step === 'processing' && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="h-8 w-8 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
            style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-white">AI is reading the syllabus…</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            This may take 30–60 seconds for large documents
          </p>
        </div>
      )}

      {/* Step: review */}
      {step === 'review' && result && (
        <div className="space-y-4">
          {/* Sections affected */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4" style={{ color: '#c9a84c' }} />
              <p className="text-sm font-medium" style={{ color: '#c9a84c' }}>
                AI found data for {result.sections_affected.length} section{result.sections_affected.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.sections_affected.map(s => (
                <span
                  key={s}
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Proposed patch preview */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              style={{ background: 'rgba(255,255,255,0.025)' }}
              onClick={() => setPatchOpen(v => !v)}
            >
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Proposed patch (JSON)
              </span>
              {patchOpen
                ? <ChevronDown  className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                : <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
              }
            </button>
            {patchOpen && (
              <pre
                className="p-4 text-xs font-mono overflow-x-auto"
                style={{ color: 'rgba(255,255,255,0.7)', background: '#0c0c14', maxHeight: 400 }}
              >
                {JSON.stringify(result.proposed_patch, null, 2)}
              </pre>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApply}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors"
              style={{ background: '#c9a84c', color: '#08080f' }}
            >
              Apply to editor
            </button>
            <button
              onClick={reset}
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
            >
              Discard
            </button>
          </div>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Applying switches you to the Edit tab. Review the merged result and save explicitly — AI never auto-saves.
          </p>
        </div>
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active:   boolean
  onClick:  () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
      style={active
        ? { background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }
        : { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
      }
    >
      {children}
    </button>
  )
}
