'use client'

// src/app/(dashboard)/dashboard/settings/_components/settings-nav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, CreditCard, Shield, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Users,
  CreditCard,
  Shield,
};

interface NavItem {
  href:  string;
  title: string;
  icon?: string;
}

interface SettingsNavProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
}

export function SettingsNav({ className, items, ...props }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn('flex flex-wrap gap-1 lg:flex-col lg:gap-0.5', className)}
      {...props}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon   = item.icon ? ICON_MAP[item.icon] : undefined;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
              active
                ? 'bg-surface-overlay text-foreground border-l-2 border-gold rounded-l-none pl-[10px]'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay/60',
            )}
          >
            {Icon && (
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-gold' : 'text-muted-foreground')} />
            )}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
