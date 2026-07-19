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
  UserCheck,
  Wallet,
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
    },
    {
      title: 'Curriculum',
      href:  '/dashboard/curricula',
      roles: ['Admin', 'Teacher'],
      icon:  Library,
    },
    {
      title: 'Knowledge Base',
      href:  '/dashboard/knowledge-base',
      roles: ['Admin', 'Teacher'],
      icon:  BookOpen,
    },
    {
      title: 'Monitor',
      href:  '/dashboard/overview',
      roles: ['Admin', 'Teacher'],
      icon:  MonitorCheck,
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
      title: 'Certificates',
      href:  '/dashboard/certificates',
      roles: ['Admin'],
      icon:  Award,
    },
    {
      title: 'Term Billing',
      href:  '/dashboard/term-billing',
      roles: ['Admin'],
      icon:  Wallet,
    },
    {
      title:                 'Approvals',
      href:                  '/dashboard/students/pending',
      roles:                 ['Admin'],
      icon:                  UserCheck,
      requiresPublicListing: true,
    },
    {
      title:                 'School Hub',
      href:                  '/dashboard/partner',
      roles:                 ['Admin'],
      icon:                  Building2,
      requiresPublicListing: true,
    },
    {
      title: 'Extras',
      href:  '/dashboard/extras',
      roles: ['Admin'],
      icon:  ShoppingBag,
    },
    {
      title:                 'Verification',
      href:                  '/dashboard/verification',
      roles:                 ['Admin'],
      icon:                  ShieldCheck,
      requiresPublicListing: true,
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