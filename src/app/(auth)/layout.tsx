import { ThemeToggle } from '@/components/layout/theme-toggle'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Background image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-colors duration-300 
        bg-[url('/assets/images/light.webp')] dark:bg-[url('/assets/images/dark2.webp')]"
        aria-hidden="true"
      />
      {/* Optional overlay for contrast */}
      <div className="fixed inset-0 -z-10 bg-white/80 dark:bg-black/90" />

      {/* Header and main content */}
      <header className="absolute right-4 top-4 z-50">
         <ThemeToggle />
      </header>
      <header className="absolute left-4 top-4 z-50">
       <Button>
         <Link href="/">Home</Link>
       </Button>
      </header>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        {children}
      </main>
    </div>
  )
}
