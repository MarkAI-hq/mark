// src/app/(dashboard)/dashboard/settings/layout.tsx
import { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';
import { SettingsNav } from './_components/settings-nav'; // We will create this next

export const metadata: Metadata = {
  title: 'Settings - Mark',
  description: 'Manage your account and organization settings.',
};

const sidebarNavItems = [
  {
    title: 'Organization',
    href: '/dashboard/settings/organization',
  },
  {
    title: 'Members',
    href: '/dashboard/settings/members',
  },
  {
    title: 'Billing',
    href: '/dashboard/settings/billing',
  },
  {
    title: 'Account & Privacy',
    href: '/dashboard/settings/account',
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account, organization, and team members.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SettingsNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
