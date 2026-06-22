// src/app/(dashboard)/dashboard/settings/layout.tsx
import { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SettingsNav } from './_components/settings-nav';

export const metadata: Metadata = {
  title: 'Settings - Mark',
  description: 'Manage your account and organization settings.',
};

const sidebarNavItems = [
  { title: 'Organization',      href: '/dashboard/settings/organization',   icon: 'Building2'  },
  { title: 'Members',           href: '/dashboard/settings/members',        icon: 'Users'      },
  { title: 'Billing',           href: '/dashboard/settings/billing',        icon: 'CreditCard' },
  { title: 'Subjects',          href: '/dashboard/subjects',                icon: 'BookMarked' },
  { title: 'Welcome Pack',      href: '/dashboard/settings/welcome-pack',   icon: 'Gift'       },
  { title: 'Account & Privacy', href: '/dashboard/settings/account',        icon: 'Shield'     },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-gold/3">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold tracking-wide uppercase">
            <Settings className="h-3 w-3" />
            Settings
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account, organisation, and team members.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="lg:w-52 shrink-0">
            <SettingsNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>

      </div>
    </div>
  );
}
