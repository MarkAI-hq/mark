'use client'

// src/app/(dashboard)/dashboard/settings/account/page.tsx

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { toast }                   from 'sonner'
import {
  Download, Trash2, Shield, Lock, FileText,
  AlertTriangle, ChevronRight,
} from 'lucide-react'

import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button }    from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge }     from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'

import { exportAccountData, deleteAccount, logout } from '@/lib/actions/auth'

export default function AccountPrivacyPage() {
  const router = useRouter()
  const [exportPending, startExport]   = useTransition()
  const [deletePending, startDelete]   = useTransition()
  const [deleteOpen,    setDeleteOpen] = useState(false)
  const [confirmText,   setConfirmText] = useState('')

  const handleExport = () => {
    startExport(async () => {
      const { data, error } = await exportAccountData()
      if (error) {
        toast.error('Export failed', { description: error.message })
        return
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `mirror-data-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully.')
    })
  }

  const handleDelete = () => {
    startDelete(async () => {
      const { error } = await deleteAccount()
      if (error) {
        toast.error('Deletion failed', { description: error.message })
        return
      }
      await logout()
      router.push('/login?deleted=1')
    })
  }

  const deleteConfirmed = confirmText.trim().toLowerCase() === 'delete my account'

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Account & Privacy
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal data, privacy rights, and account lifecycle.
        </p>
      </div>

      {/* ── Data rights ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Your Data Rights
          </CardTitle>
          <CardDescription>
            Under GDPR, CCPA, and similar regulations you have the right to access,
            export, and erase your personal data at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Export my data</p>
              <p className="text-xs text-muted-foreground">
                Download a copy of your profile, activity log, and all personal
                information we hold — as a machine-readable JSON file.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleExport}
              disabled={exportPending}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              {exportPending ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Data retention ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Data Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {[
            ['Profile data', 'Retained for the lifetime of your account.'],
            ['Assessment results', 'Retained for 5 years to support longitudinal analytics.'],
            ['Activity logs', 'Retained for 12 months for security and audit purposes.'],
            ['Deleted account data', 'Anonymised immediately. Retained in anonymised form for 30 days, then purged.'],
          ].map(([label, desc]) => (
            <div key={label} className="flex items-start gap-3">
              <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
              <div>
                <span className="font-medium text-foreground">{label}: </span>
                {desc}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* ── Danger zone ─────────────────────────────────────────────────── */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Delete my account</p>
                <Badge variant="destructive" className="text-xs">Irreversible</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Your account will be anonymised immediately. All personal identifiers
                (name, email) will be permanently removed. Assessment data associated
                with your organisation will remain for continuity.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Delete confirmation dialog ───────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete your account?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              <span className="block">
                This will <strong>permanently anonymise</strong> your account.
                You will be logged out immediately and will not be able to recover
                your data.
              </span>
              <span className="block text-muted-foreground">
                Assessment records linked to your organisation will be preserved
                for continuity.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type <strong>delete my account</strong> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="font-mono"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setConfirmText('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteConfirmed || deletePending}
              onClick={handleDelete}
            >
              {deletePending ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
