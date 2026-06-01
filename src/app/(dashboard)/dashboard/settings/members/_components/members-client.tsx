'use client'

// src/app/(dashboard)/dashboard/settings/members/_components/members-client.tsx

import { useState, useMemo, useTransition } from 'react'
import { Plus }  from 'lucide-react'
import { toast } from 'sonner'

import {
  OrganizationUser,
  inviteUserToOrganization,
  removeUserFromOrganization,
  updateUserRole,
} from '@/lib/actions/organizations'
import { MembersTable }   from '@/components/organization/members-table'
import { Button }         from '@/components/ui/button'
import { RoleGuard }      from '@/components/auth/role-guard'
import {
  InviteMemberDialog,
  InviteMemberData,
} from '@/components/organization/invite-member-dialog'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  ManageRoleDialog,
  ManageRoleData,
} from '@/components/organization/manage-role-dialog'

interface MembersClientProps {
  initialMembers: OrganizationUser[]
  organizationId: string
  availableRoles?: { role_id: string; role_name: string; description: string | null }[]
}

export function MembersClient({
  initialMembers,
  organizationId,
  availableRoles,
}: MembersClientProps) {
  const [members,            setMembers]            = useState<OrganizationUser[]>(initialMembers)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [userToManage,       setUserToManage]        = useState<OrganizationUser | null>(null)
  const [userToRemove,       setUserToRemove]        = useState<OrganizationUser | null>(null)
  const [isPending,          startTransition]        = useTransition()

  const handleManageUserClick = (user: OrganizationUser) => setUserToManage(user)
  const handleRemoveUserClick = (user: OrganizationUser) => setUserToRemove(user)

  const handleConfirmRemove = () => {
    if (!userToRemove) return
    startTransition(async () => {
      const { error } = await removeUserFromOrganization(
        organizationId,
        userToRemove.user_id,
      )
      if (error) {
        toast.error('Failed to remove member', { description: error.message })
      } else {
        toast.success('Member removed successfully.')
        setMembers((prev) => prev.filter((m) => m.user_id !== userToRemove.user_id))
        setUserToRemove(null)
      }
    })
  }

  const handleInviteSubmit = (formData: InviteMemberData) => {
    startTransition(async () => {
      const { error } = await inviteUserToOrganization(
        organizationId,
        formData.email,
        formData.role,
      )

      if (error) {
        toast.error('Failed to send invitation', { description: error.message })
        return
      }

      toast.success('Invitation sent successfully.')
      setIsInviteDialogOpen(false)
    })
  }

  const handleRoleUpdateSubmit = (formData: ManageRoleData) => {
    if (!userToManage) return
    startTransition(async () => {
      const { error } = await updateUserRole(
        organizationId,
        userToManage.user_id,
        formData.role as 'Admin' | 'Teacher',
      )
      if (error) {
        toast.error('Failed to update role', { description: error.message })
      } else {
        toast.success('User role updated successfully.')
        setMembers((prev) =>
          prev.map((m) =>
            m.user_id === userToManage.user_id ? { ...m, role: formData.role } : m,
          ),
        )
        setUserToManage(null)
      }
    })
  }

  const tableProps = useMemo(
    () => ({
      data:     members,
      onManage: handleManageUserClick,
      onRemove: handleRemoveUserClick,
      headerSlot: (
        <RoleGuard requiredRole="Admin">
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </RoleGuard>
      ),
    }),
    [members],
  )

  return (
    <>
      <MembersTable {...tableProps} />

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSubmit={handleInviteSubmit}
        isSubmitting={isPending}
        availableRoles={availableRoles}
      />

      <ConfirmDialog
        open={!!userToRemove}
        onOpenChange={() => setUserToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Are you sure?"
        description={`This will remove ${userToRemove?.first_name ?? 'the user'} from the organization.`}
        confirmText="Yes, Remove Member"
        isDestructive
      />

      <ManageRoleDialog
        open={!!userToManage}
        onOpenChange={() => setUserToManage(null)}
        onSubmit={handleRoleUpdateSubmit}
        isSubmitting={isPending}
        user={userToManage}
      />
    </>
  )
}