// src/app/app/page.tsx
//
// Start page of the installed PWA (manifest start_url). Middleware never lets
// a signed-in user see this page — they go straight to their role's home. A
// signed-out device with a remembered choice goes straight to that sign-in
// form. Everyone else picks who they are here. `?choose=1` forces the chooser.

import { Metadata } from 'next'
import Image from 'next/image'
import { RoleChooser } from './_components/role-chooser'

export const metadata: Metadata = {
  title:       'Sign in — Mirror Intelligence',
  description: 'Choose how you sign in to Mirror',
}

export default function AppStartPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/assets/images/markBlackBg.png"
            alt="Mirror Intelligence"
            width={120}
            height={60}
            className="rounded-lg"
            priority
          />
        </div>

        <h1 className="text-3xl font-black tracking-tighter text-foreground text-center leading-tight">
          Who&apos;s signing in?
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5 mb-8">
          Pick one — we&apos;ll remember it on this device.
        </p>

        <RoleChooser />
      </div>
    </main>
  )
}
