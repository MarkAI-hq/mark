// src/components/nav/mobile-nav.tsx
'use client'

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MainNav } from './main-nav';
// import { Logo } from '@/components/layout/logo';

interface MobileNavProps {
  organizationName?: string | null;
}

export function MobileNav({ organizationName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:!hidden" // Only show on mobile
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-6 text-lg font-medium">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            {/* <Logo /> */}
          </div>
          {/* Reuse the MainNav component for consistency */}
          <MainNav organizationName={organizationName} collapsed={false} onToggleCollapse={function (): void {
            throw new Error('Function not implemented.');
          } } />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
