// src/app/(dashboard)/dashboard/settings/organization/_components/settings-client.tsx
'use client'

import { useState, useTransition } from 'react';
import { Globe, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from '@/hooks/use-toast';
import { Organization } from '@/lib/types';
import { updateOrganization, updateOrgSso, updatePricingSettings } from '@/lib/actions/organizations';
import {
  OrganizationProfileForm,
  OrganizationProfileData,
} from '@/components/organization/organization-profile-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GoPublicWizard } from './go-public-wizard'
import { GoPrivateDialog } from './go-private-dialog'

interface SettingsClientProps {
  organization: Organization;
}

export function SettingsClient({ organization: initialOrganization }: SettingsClientProps) {
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [isPending,    startTransition]  = useTransition();
  const [isSsoPending, startSsoTransition] = useTransition();
  const [wizardOpen,   setWizardOpen]    = useState(false)
  const [privateOpen,  setPrivateOpen]   = useState(false)
  const [isPricingPending, startPricingTransition] = useTransition();

  const isPublic     = organization.is_public
  const hasSigned    = !!organization.partner_config?.marketplace_agreement

  // Falls back to the platform-wide default (100,000 UGX admission /
  // 750,000 UGX·$218 term fee) when this school hasn't set its own —
  // matches ADMISSION_FEE_AMOUNT_UGX / DEFAULT_TERM_FEE_UGX server-side,
  // shown here so "blank" reads as "using the platform default" not "$0".
  const [admissionFeeUgx, setAdmissionFeeUgx] = useState(
    organization.partner_config?.admission_fee_ugx?.toString() ?? '',
  )
  const [termFeeUgx, setTermFeeUgx] = useState(
    organization.partner_config?.term_fee_ugx?.toString() ?? '',
  )
  const [termFeeUsd, setTermFeeUsd] = useState(
    organization.partner_config?.term_fee_usd?.toString() ?? '',
  )

  const handleSavePricing = () => {
    startPricingTransition(async () => {
      const payload: Parameters<typeof updatePricingSettings>[0] = {}
      if (admissionFeeUgx.trim()) payload.admission_fee_ugx = Number(admissionFeeUgx)
      if (termFeeUgx.trim())      payload.term_fee_ugx      = Number(termFeeUgx)
      if (termFeeUsd.trim())      payload.term_fee_usd      = Number(termFeeUsd)

      const { data, error } = await updatePricingSettings(payload)
      if (error) {
        toast({ title: 'Failed to update pricing', description: error.message, variant: 'destructive' })
        return
      }
      toast({ title: 'Pricing updated', description: 'New charges apply from the next admission/term payment onward.' })
      if (data) {
        setOrganization((prev) => ({
          ...prev,
          partner_config: {
            ...prev.partner_config,
            admission_fee_ugx: data.admission_fee_ugx ?? undefined,
            term_fee_ugx: data.term_fee_ugx ?? undefined,
            term_fee_usd: data.term_fee_usd ?? undefined,
          },
        }))
      }
    })
  }

  const handleProfileUpdate = (formData: OrganizationProfileData) => {
    startTransition(async () => {
      const { data: updatedOrganization, error } = await updateOrganization(
        organization.organization_id,
        formData,
      );

      if (error) {
        toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Organization profile updated successfully!' });
        if (updatedOrganization) {
          setOrganization(updatedOrganization);
        }
      }
    });
  };

  const handleSsoToggle = (checked: boolean) => {
    startSsoTransition(async () => {
      const { error } = await updateOrgSso(organization.organization_id, checked);
      if (error) {
        toast({ title: 'Failed to update SSO setting', description: error.message, variant: 'destructive' });
      } else {
        setOrganization(prev => ({ ...prev, sso_required: checked }));
        toast({
          title: checked ? 'SSO enforcement enabled' : 'SSO enforcement disabled',
          description: checked
            ? 'Invited staff must now sign in with Google.'
            : 'Staff can now use email and password.',
        });
      }
    });
  };

  return (
    <div className="space-y-10">
      <OrganizationProfileForm
        organization={organization}
        onSubmit={handleProfileUpdate}
        isSubmitting={isPending}
      />

      <Separator />

      {/* ── Marketplace ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Marketplace</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control whether your school is publicly listed in the Mirror Intelligence directory.
          </p>
        </div>

        {isPublic ? (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Globe className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-emerald-800">Listed Publicly</CardTitle>
                    <CardDescription className="text-xs text-emerald-600 mt-0">
                      Your school is visible in the Mirror Intelligence directory
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {organization.school_code && (
                <a
                  href={`/schools/${organization.school_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  View your public profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Admissions, School Hub, and Verification are now active in your nav.
                </p>
                <button
                  onClick={() => setPrivateOpen(true)}
                  className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
                >
                  Go Private
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {hasSigned ? 'Rejoin the Marketplace' : 'Join the Marketplace'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0">
                    {hasSigned
                      ? 'Your school was previously listed. Re-activate to start accepting applications again.'
                      : 'List your school publicly to accept student applications and earn marketplace revenue.'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <p className="text-xs text-muted-foreground/80">
                <span className="font-medium">Admissions</span>, <span className="font-medium">School Hub</span>, and <span className="font-medium">Verification</span> are hidden until you go public.
              </p>
              <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {hasSigned ? 'Rejoin' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Pricing</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Override the platform default admission fee and term fee for your school. Leave a
            field blank to use the platform default. Changes apply to the next payment — plans
            already in progress keep the amount they were created with.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="admission-fee-ugx">Admission fee (UGX)</Label>
            <Input
              id="admission-fee-ugx"
              type="number"
              min={0}
              placeholder="Platform default"
              value={admissionFeeUgx}
              onChange={(e) => setAdmissionFeeUgx(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="term-fee-ugx">Term fee (UGX)</Label>
            <Input
              id="term-fee-ugx"
              type="number"
              min={0}
              placeholder="Platform default"
              value={termFeeUgx}
              onChange={(e) => setTermFeeUgx(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="term-fee-usd">Term fee, USD (display only)</Label>
            <Input
              id="term-fee-usd"
              type="number"
              min={0}
              placeholder="Platform default"
              value={termFeeUsd}
              onChange={(e) => setTermFeeUsd(e.target.value)}
            />
          </div>
        </div>

        <Button size="sm" onClick={handleSavePricing} disabled={isPricingPending}>
          {isPricingPending ? 'Saving…' : 'Save pricing'}
        </Button>
      </div>

      <Separator />

      {/* ── SSO ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Single Sign-On</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Require all invited staff to sign in with Google Workspace. Password login will be disabled for new members.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="sso-toggle" className="text-sm font-medium">
              Enforce Google SSO
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, invited teachers will see &quot;Accept with Google&quot; instead of a password form.
            </p>
          </div>
          <Switch
            id="sso-toggle"
            checked={organization.sso_required}
            onCheckedChange={handleSsoToggle}
            disabled={isSsoPending}
          />
        </div>
      </div>

      <GoPublicWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        schoolName={organization.name}
        onSuccess={() => setOrganization(prev => ({ ...prev, is_public: true }))}
      />

      <GoPrivateDialog
        open={privateOpen}
        onOpenChange={setPrivateOpen}
        onSuccess={() => setOrganization(prev => ({ ...prev, is_public: false }))}
      />
    </div>
  );
}
