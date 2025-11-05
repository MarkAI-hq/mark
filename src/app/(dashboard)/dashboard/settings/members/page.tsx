// src/app/(dashboard)/dashboard/settings/members/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrganizationUsers } from '@/lib/actions/organizations';
import { MembersClient } from './_components/members-client'; // We will create this next

export default async function MembersPage() {
  const user = await getSession();

  if (!user || !user.organizationId) {
    redirect('/login');
  }

  if (user.role !== 'Admin') {
    redirect('/dashboard');
  }

  const { data: members, error } = await getOrganizationUsers(
    user.organizationId,
  );

  if (error) {
    return (
      <div>
        <h3 className="text-lg font-medium">Error</h3>
        <p className="text-sm text-muted-foreground">
          Failed to load members: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Members</h3>
        <p className="text-sm text-muted-foreground">
          Invite and manage your organization&apos;s members.
        </p>
      </div>
      <MembersClient initialMembers={members ?? []} organizationId={user.organizationId} />
    </div>
  );
}
