// src/app/(dashboard)/dashboard/settings/organization/_components/settings-client.tsx
'use client'

import { useState, useTransition } from 'react';
import { toast } from '@/hooks/use-toast';
import { Organization } from '@/lib/types';
import { updateOrganization, updateOrgSso } from '@/lib/actions/organizations';
import {
  OrganizationProfileForm,
  OrganizationProfileData,
} from '@/components/organization/organization-profile-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface SettingsClientProps {
  organization: Organization;
}

export function SettingsClient({ organization: initialOrganization }: SettingsClientProps) {
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [isPending,    startTransition]  = useTransition();
  const [isSsoPending, startSsoTransition] = useTransition();

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

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Single Sign-On</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Require all invited staff to sign in with Google Workspace. Password login will be disabled for new members.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
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
    </div>
  );
}
