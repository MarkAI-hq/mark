// src/app/(dashboard)/dashboard/settings/members/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrganizationUsers, getAvailableRoles } from '@/lib/actions/organizations';
import { MembersClient } from './_components/members-client';

export default async function MembersPage() {
  const user = await getSession();

  if (!user || !user.organizationId) {
    redirect('/login');
  }

  if (user.role !== 'Admin') {
    redirect('/dashboard');
  }

  const [membersRes, rolesRes] = await Promise.all([
    getOrganizationUsers(user.organizationId),
    getAvailableRoles(),
  ]);

  if (membersRes.error) {
    return (
      <div>
        <h3 className="text-lg font-medium">Error</h3>
        <p className="text-sm text-muted-foreground">
          Failed to load members: {membersRes.error.message}
        </p>
      </div>
    );
  }

  // Filter out platform-level roles from the invite options
  const PLATFORM_ROLES = ['Root', 'Support']
  const availableRoles = (rolesRes.data ?? []).filter(r => !PLATFORM_ROLES.includes(r.role_name))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Members</h3>
        <p className="text-sm text-muted-foreground">
          Invite and manage your organization&apos;s members.
        </p>
      </div>
      <MembersClient
        initialMembers={membersRes.data ?? []}
        organizationId={user.organizationId}
        availableRoles={availableRoles}
      />
    </div>
  );
}
