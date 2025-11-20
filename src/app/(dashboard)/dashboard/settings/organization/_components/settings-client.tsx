// src/app/(dashboard)/dashboard/settings/organization/_components/settings-client.tsx
'use client'

import { useState, useTransition } from 'react';
// FIX: Import the correct toast function
import { toast } from '@/hooks/use-toast';
import { Organization } from '@/lib/types';
import { updateOrganization } from '@/lib/actions/organizations';
import {
  OrganizationProfileForm,
  OrganizationProfileData,
} from '@/components/organization/organization-profile-form';

interface SettingsClientProps {
  organization: Organization;
}

export function SettingsClient({ organization: initialOrganization }: SettingsClientProps) {
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [isPending, startTransition] = useTransition();

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

  return (
    <OrganizationProfileForm
      organization={organization}
      onSubmit={handleProfileUpdate}
      isSubmitting={isPending}
    />
  );
}
