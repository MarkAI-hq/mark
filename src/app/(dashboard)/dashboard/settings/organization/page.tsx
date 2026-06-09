// src/app/(dashboard)/dashboard/settings/organization/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrganizationDetails } from '@/lib/actions/organizations';
import { SettingsClient } from './_components/settings-client'; // We will create this client component

export default async function OrganizationProfilePage() {
  const user = await getSession();

  if (!user || !user.organizationId) {
    redirect('/login');
  }

  if (user.role !== 'Admin') {
    // You can render an access denied message or redirect
    redirect('/dashboard');
  }

  const { data: organization, error } = await getOrganizationDetails(
    user.organizationId,
  );

  if (error || !organization) {
    return (
      <div>
        <h3 className="text-lg font-medium">Error</h3>
        <p className="text-sm text-muted-foreground">
          Failed to load organization profile: {error?.message || 'Not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">Organisation Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your school&apos;s name, logo, and contact details.
        </p>
      </div>
      <SettingsClient organization={organization} />
    </div>
  );
}
