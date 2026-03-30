// src/config/dashboard.ts
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard,
  BookMarked,
  Users,
  FileSignature,
  HelpCircle,
  Settings,
  LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title:     string
  href:      string
  disabled?: boolean
  roles:     UserRole[]
  icon:      LucideIcon
  roleHref?: Partial<Record<UserRole, string>>
}

export const dashboardConfig = {
  mainNav: [
    {
      title: 'Dashboard',
      href:  '/dashboard',
      roles: ['Admin', 'Teacher'],
      icon:  LayoutDashboard,
      roleHref: {
        Admin:   '/dashboard',
        Teacher: '/dashboard/teacher',
      },
    },
    {
      title: 'Subjects',
      href:  '/dashboard/subjects',
      roles: ['Admin'],
      icon:  BookMarked,
    },
        {
      title: 'Courses',
      href:  '/dashboard/courses',
      roles: ['Admin'],
      icon:  BookMarked,
    },
    {
      title: 'Classes',
      href:  '/dashboard/classes',
      roles: ['Admin', 'Teacher'],
      icon:  Users,
      roleHref: {
        Admin:   '/dashboard/classes',
        Teacher: '/dashboard/teacher/classes',
      },
    },
    {
      title: 'Examination Centre',
      href:  '/dashboard/exam-builder',
      roles: ['Admin', 'Teacher'],
      icon:  FileSignature,
    },
    {
      title: 'Get Help',
      href:  '/dashboard/help',
      roles: ['Admin', 'Teacher', 'Student'],
      icon:  HelpCircle,
    },
    {
      title: 'Settings',
      href:  '/dashboard/settings',
      roles: ['Admin', 'Teacher'],
      icon:  Settings,
      roleHref: {
        Admin:   '/dashboard/settings/organization',
        Teacher: '/dashboard/teacher/settings',
      },
    },
  ] as NavItem[],
}