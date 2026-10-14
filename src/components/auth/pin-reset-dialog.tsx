// src/components/auth/pin-reset-dialog.tsx
'use client'

import { useState } from 'react'
import { Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react'

import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { requestPinReset, verifyPinReset } from '@/lib/actions/student-auth'

type Phase = 'request' | 'verify' | 'done'

interface PinResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSchoolCode?: string
  initialStudentId?: string
}

// Self-service PIN recovery, reusing the same "send a 6-digit code, verify
// it, then issue a fresh PIN" pattern as enrolment OTP verification. Only
// works when the student has a real email on file — the backend returns a
// clear "ask your teacher" error otherwise, shown here as a normal form error.
export function PinResetDialog({
  open,
  onOpenChange,
  initialSchoolCode = '',
  initialStudentId = '',
}: PinResetDialogProps) {
  const [phase, setPhase] = useState<Phase>('request')
  const [schoolCode, setSchoolCode] = useState(initialSchoolCode)
  const [studentSchoolId, setStudentSchoolId] = useState(initialStudentId)
  const [studentId, setStudentId] = useState('')
  const [maskedContact, setMaskedContact] = useState('')
  const [code, setCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function reset() {
    setPhase('request')
    setCode('')
    setError(null)
    setNewPin('')
  }

  async function handleRequest() {
    setError(null)
    if (!schoolCode.trim() || !studentSchoolId.trim()) {
      setError('Enter your school code and student ID.')
      return
    }
    setPending(true)
    const result = await requestPinReset({
      school_code: schoolCode.toUpperCase().trim(),
      student_school_id: studentSchoolId.trim(),
    })
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setStudentId(result.data!.student_id)
    setMaskedContact(result.data!.contact)
    setPhase('verify')
  }

  async function handleVerify() {
    setError(null)
    if (!code.trim()) {
      setError('Enter the code we sent you.')
      return
    }
    setPending(true)
    const result = await verifyPinReset({ student_id: studentId, code: code.trim() })
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setNewPin(result.data!.pin)
    setPhase('done')
    toast({ title: 'PIN reset', description: 'Your new PIN is ready.' })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-gold" />
            Reset your PIN
          </DialogTitle>
          <DialogDescription>
            {phase === 'request' &&
              "We'll email a 6-digit code to the address on file for your account."}
            {phase === 'verify' && `Enter the code we sent to ${maskedContact}.`}
            {phase === 'done' && 'Write this down — you can use it to sign in now.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {phase === 'request' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">School Code</Label>
              <Input
                placeholder="e.g. MIR-2024"
                className="uppercase tracking-widest"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Student ID</Label>
              <Input
                placeholder="e.g. S001"
                value={studentSchoolId}
                onChange={(e) => setStudentSchoolId(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-bold"
              disabled={pending}
              onClick={handleRequest}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send code'}
            </Button>
          </div>
        )}

        {phase === 'verify' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">6-digit code</Label>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-bold"
              disabled={pending}
              onClick={handleVerify}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & get new PIN'}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:text-gold"
              onClick={() => setPhase('request')}
            >
              Use a different school code or student ID
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-gold" />
              <div className="relative">
                <p className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
                  {showPin ? newPin : '••••••'}
                </p>
                <button
                  type="button"
                  className="absolute -right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPin((p) => !p)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-bold"
              onClick={() => onOpenChange(false)}
            >
              Done — take me to sign in
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
