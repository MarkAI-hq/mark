'use client'

// src/components/organization/members-table.tsx

import { MoreHorizontal, ShieldCheck, User, BookOpen } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button }           from '@/components/ui/button'
import { DataTable }        from '@/components/ui/data-table'
import { OrganizationUser } from '@/lib/actions/organizations'
import { Badge }            from '@/components/ui/badge'

// Extend OrganizationUser locally until the backend type is updated
type MemberRow = OrganizationUser & {
  classes?: Array<{ class_id: string; name: string }>
}

interface MembersTableProps {
  data:             MemberRow[]
  onManage:         (user: OrganizationUser) => void
  onRemove:         (user: OrganizationUser) => void
  onManageClasses?: (user: OrganizationUser) => void
  headerSlot?:      React.ReactNode
}

export function MembersTable({
  data,
  onManage,
  onRemove,
  onManageClasses,
  headerSlot,
}: MembersTableProps) {
  const columns: ColumnDef<MemberRow>[] = [
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
      cell: ({ row }) => {
        const role = row.original.role

        if (!role) {
          return <span className="text-muted-foreground">No Role</span>
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
        )
      },
    },
    {
      id:     'classes',
      header: 'Classes',
      cell: ({ row }) => {
        const user    = row.original
        const classes = user.classes ?? []

        if (user.role !== 'Teacher') {
          return <span className="text-muted-foreground">—</span>
        }

        if (classes.length === 0) {
          return (
            <span className="text-xs text-muted-foreground italic">
              None assigned
            </span>
          )
        }

        return (
          <div className="flex flex-wrap gap-1">
            {classes.slice(0, 2).map((cls: { class_id: string; name: string }) => (
              <Badge key={cls.class_id} variant="outline" className="text-xs">
                <BookOpen className="mr-1 h-3 w-3" />
                {cls.name}
              </Badge>
            ))}
            {classes.length > 2 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{classes.length - 2} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'email_verified',
      header: 'Status',
      cell: ({ row }) => {
        const isVerified = row.getValue('email_verified')
        return isVerified ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Verified
          </Badge>
        ) : (
          <Badge variant="destructive">Unverified</Badge>
        )
      },
    },
    {
      id:     'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user      = row.original
        const isTeacher = user.role === 'Teacher'

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
              {isTeacher && onManageClasses && (
                <DropdownMenuItem onClick={() => onManageClasses(user)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manage Classes
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onRemove(user)}
              >
                Remove from Organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      filter={{ prompt: 'Filter members...', column: 'email' }}
      headerSlot={headerSlot}
    />
  )
}