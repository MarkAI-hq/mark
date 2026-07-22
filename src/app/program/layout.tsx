import { Navbar } from '@/components/layout/sections/navbar'
import { FooterSection } from '@/components/nav/footer-landing'
import { ExitIntentCompassModal } from '@/components/marketing/exit-intent-compass-modal'

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <ExitIntentCompassModal />
    </>
  )
}
