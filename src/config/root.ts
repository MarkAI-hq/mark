import { LayoutDashboard, Building2, ImageIcon, ShieldCheck, ScrollText, Megaphone, BookOpen, ShieldPlus, Inbox, BadgeCheck, BarChart2, Zap, Settings, LucideIcon } from 'lucide-react'

export interface RootNavItem {
  title:     string
  href:      string
  icon:      LucideIcon
  rootOnly?: boolean
}

export const rootConfig = {
  mainNav: [
    { title: 'Platform',       href: '/root',                    icon: LayoutDashboard },
    { title: 'Organizations',  href: '/root/organizations',      icon: Building2       },
    { title: 'Image Library',  href: '/root/curriculum-images',  icon: ImageIcon,   rootOnly: true },
    { title: 'System Content', href: '/root/system-assessments', icon: ShieldCheck, rootOnly: true },
    { title: 'Announcements',  href: '/root/announcements',      icon: Megaphone,   rootOnly: true },
    { title: 'Curricula',      href: '/root/curricula',          icon: BookOpen                    },
    { title: 'Roles',          href: '/root/roles',              icon: ShieldPlus,  rootOnly: true },
    { title: 'Audit Log',      href: '/root/audit',              icon: ScrollText,  rootOnly: true },
    { title: 'Support Inbox',  href: '/root/support',            icon: Inbox,       rootOnly: true },
    { title: 'Verifications', href: '/root/verifications',      icon: BadgeCheck                  },
    { title: 'Benchmarks',    href: '/root/benchmarks',          icon: BarChart2                    },
    { title: 'Learning Velocity', href: '/root/learning-velocity', icon: Zap                        },
    { title: 'Settings',      href: '/root/settings',           icon: Settings                     },
  ] as RootNavItem[],
}
