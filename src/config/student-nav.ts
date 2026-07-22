// src/config/student-nav.ts
import {
  Sparkles,
  LayoutDashboard,
  BookOpenCheck,
  BookOpen,
  CalendarDays,
  TrendingUp,
  Library,
  NotebookPen,
  History,
  Users,
  Award,
  FileCheck,
  Gift,
  ArrowRightLeft,
  GraduationCap,
  Settings,
  LucideIcon,
} from 'lucide-react'

export interface StudentNavItem {
  title:                string
  href:                 string
  icon:                 LucideIcon
  hideForMarketplace?:  boolean
}

export const studentNavItems: StudentNavItem[] = [
  { title: 'Tracy',          href: '/student/tracy',         icon: Sparkles                                  },
  { title: 'Home',           href: '/student/dashboard',     icon: LayoutDashboard                           },
  { title: 'Subjects',       href: '/student/subjects',      icon: BookOpenCheck                             },
  { title: 'Study Plans',    href: '/student/study-plans',   icon: BookOpen                                  },
  { title: 'Schedule',       href: '/student/schedule',      icon: CalendarDays                              },
  { title: 'Progress',       href: '/student/progress',      icon: TrendingUp                                },
  { title: 'Grades',         href: '/student/grades',        icon: GraduationCap                             },
  { title: 'Learning History', href: '/student/learning-history', icon: History                              },
  { title: 'Library',        href: '/student/library',       icon: Library                                   },
  { title: 'Knowledge Base', href: '/student/knowledge-base',icon: NotebookPen                                },
  { title: 'My School',      href: '/student/school',        icon: Users,         hideForMarketplace: true   },
  { title: 'Certificates',   href: '/student/certificates',  icon: Award                                     },
  { title: 'Exams',          href: '/student/exams',         icon: FileCheck                                 },
  { title: 'Welcome Pack',   href: '/student/welcome-pack',  icon: Gift                                      },
  { title: 'Transfer',       href: '/student/transfer',      icon: ArrowRightLeft, hideForMarketplace: true  },
  { title: 'Settings',       href: '/student/settings',      icon: Settings                                  },
]
