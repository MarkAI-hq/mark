// src/config/dashboard.ts
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileSignature,
  HelpCircle,
  Settings,
  Sparkles,
  Library,
  MonitorCheck,
  Award,
  Building2,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Wallet,
  Megaphone,
  Activity,
  LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title:                  string
  href:                   string
  disabled?:              boolean
  roles:                  UserRole[]
  icon:                   LucideIcon
  roleHref?:              Partial<Record<UserRole, string>>
  requiresPublicListing?: boolean
  /** Section label rendered above this item when it differs from the previous item's group. Omit for ungrouped/pinned items (e.g. Tracy). */
  group?:                 string
}

export const dashboardConfig = {
  mainNav: [
    {
      title: 'Tracy',
      href:  '/dashboard/tracy',
      roles: ['Admin', 'Teacher'],
      icon:  Sparkles,
    },
    {
      title: 'Dashboard',
      href:  '/dashboard',
      roles: ['Admin', 'Teacher'],
      icon:  LayoutDashboard,
      roleHref: {
        Admin:   '/dashboard',
        Teacher: '/dashboard/teacher',
      },
      group: 'Teaching',
    },
    {
      title: 'Class Monitor',
      href:  '/dashboard/overview',
      roles: ['Admin', 'Teacher'],
      icon:  MonitorCheck,
      group: 'Teaching',
    },
    {
      title: 'Curriculum',
      href:  '/dashboard/curricula',
      roles: ['Admin', 'Teacher'],
      icon:  Library,
      group: 'Teaching',
    },
    {
      title: 'Knowledge Base',
      href:  '/dashboard/knowledge-base',
      roles: ['Admin', 'Teacher'],
      icon:  BookOpen,
      group: 'Teaching',
    },
    {
      title: 'Review Queue',
      href:  '/dashboard/review-queue',
      roles: ['Admin', 'Teacher'],
      icon:  ShieldAlert,
      group: 'Teaching',
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
      group: 'Teaching',
    },
    {
      title: 'Examination Centre',
      href:  '/dashboard/exam-builder',
      roles: ['Admin', 'Teacher'],
      icon:  FileSignature,
      group: 'Teaching',
    },
    {
      title: 'Certificates',
      href:  '/dashboard/certificates',
      roles: ['Admin'],
      icon:  Award,
      group: 'School Operations',
    },
    {
      title: 'Notices & Calendar',
      href:  '/dashboard/notices',
      roles: ['Admin', 'Teacher'],
      icon:  Megaphone,
      group: 'School Operations',
    },
    {
      title: 'Term Billing',
      href:  '/dashboard/term-billing',
      roles: ['Admin'],
      icon:  Wallet,
      group: 'School Operations',
    },
    {
      title:                 'Approvals',
      href:                  '/dashboard/students/pending',
      roles:                 ['Admin'],
      icon:                  UserCheck,
      requiresPublicListing: true,
      group:                 'School Operations',
    },
    {
      title:                 'School Hub',
      href:                  '/dashboard/partner',
      roles:                 ['Admin'],
      icon:                  Building2,
      requiresPublicListing: true,
      group:                 'School Operations',
    },
    {
      title: 'Extras',
      href:  '/dashboard/extras',
      roles: ['Admin'],
      icon:  ShoppingBag,
      group: 'School Operations',
    },
    {
      title: 'Content Health',
      href:  '/dashboard/content-health',
      roles: ['Admin'],
      icon:  Activity,
      group: 'School Operations',
    },
    {
      title:                 'Verification',
      href:                  '/dashboard/verification',
      roles:                 ['Admin'],
      icon:                  ShieldCheck,
      requiresPublicListing: true,
      group:                 'School Operations',
    },
    {
      title: 'Get Help',
      href:  '/dashboard/help',
      roles: ['Admin', 'Teacher', 'Student'],
      icon:  HelpCircle,
      group: 'Account',
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
      group: 'Account',
    },
  ] as NavItem[],
}