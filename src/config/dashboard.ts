// src/config/dashboard.ts
import { UserRole } from '@/lib/types';

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  roles: UserRole[];
}

export const dashboardConfig: { mainNav: NavItem[] } = {
  mainNav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      roles: ['Admin', 'Teacher'],
    },
    {
      title: 'Subjects',
      href: '/dashboard/subjects',
      roles: ['Admin', 'Teacher'],
    },
    {
      title: 'Courses',
      href: '/dashboard/courses',
      roles: ['Admin', 'Teacher', 'Student'],
    },
    {
      title: 'Classes',
      href: '/dashboard/classes',
      roles: ['Admin', 'Teacher'],
    },
    {
      title: 'Examination Centre',
      href: '/dashboard/exams',
      roles: ['Admin', 'Teacher'],
    },
    {
      title: 'Artificial Classes',
      href: '/dashboard/#2',
      roles: ['Admin', 'Teacher'],
    },
    {
      title: 'Library',
      href: '/dashboard/#1',
      roles: ['Admin', 'Teacher'],
    },
    {
      title: 'Creator Labs',
      href: '/dashboard/#3',
      roles: ['Admin', 'Teacher', 'Student'],
    },
    {
      title: 'Get Help',
      href: '/dashboard/#',
      roles: ['Admin', 'Teacher', 'Student'],
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      roles: ['Admin', 'Teacher', 'Student'],
    },
  ],
};
