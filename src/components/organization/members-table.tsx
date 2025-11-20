// src/components/organization/members-table.tsx
'use client'

import { MoreHorizontal, ShieldCheck, User } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { OrganizationUser } from '@/lib/actions/organizations'
import { Badge } from '@/components/ui/badge'

interface MembersTableProps {
  data: OrganizationUser[]
  onManage: (user: OrganizationUser) => void
  onRemove: (user: OrganizationUser) => void
  headerSlot?: React.ReactNode
}

export function MembersTable({
  data,
  onManage,
  onRemove,
  headerSlot,
}: MembersTableProps) {
  const columns: ColumnDef<OrganizationUser>[] = [
    {
      accessorKey: 'first_name',
      header: 'First Name',
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      // FIX: The cell now receives the 'row' and uses the real role data.
      cell: ({ row }) => {
        const role = row.original.role;

        if (!role) {
          return <span className="text-muted-foreground">No Role</span>;
        }

        return (
          <Badge variant={role === 'Admin' ? 'default' : 'secondary'}>
            {role === 'Admin' ? (
              <ShieldCheck className="mr-2 h-4 w-4" />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'email_verified',
      header: 'Status',
      cell: ({ row }) => {
        const isVerified = row.getValue('email_verified');
        return isVerified ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Verified
          </Badge>
        ) : (
          <Badge variant="destructive">Unverified</Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onManage(user)}>
                Manage Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onRemove(user)}
              >
                Remove from Organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      filter={{ prompt: 'Filter members...', column: 'email' }}
      headerSlot={headerSlot}
    />
  );
}
