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

  // Only Admin and Teacher can be invited — Students join via student login, platform roles are internal
  const INVITABLE_ROLES = ['Admin', 'Teacher']
  const fetchedRoles = (rolesRes.data ?? []).filter(r => INVITABLE_ROLES.includes(r.role_name))
  // Always ensure Teacher and Admin are available even if the /roles endpoint omits them
  const availableRoles = INVITABLE_ROLES.map(name => {
    const found = fetchedRoles.find(r => r.role_name === name)
    return found ?? { role_id: name.toLowerCase(), role_name: name, description: null }
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">Members</h3>
        <p className="text-sm text-muted-foreground">
          Invite and manage your organisation&apos;s admins and teachers.
        </p>
      </div>
      <MembersClient
        initialMembers={membersRes.data ?? []}
        organizationId={user.organizationId}
        availableRoles={availableRoles}
        currentUserId={user.id}
      />
    </div>
  );
}
