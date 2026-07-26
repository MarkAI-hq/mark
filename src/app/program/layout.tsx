import { Navbar } from '@/components/layout/sections/navbar'
import { FooterSection } from '@/components/nav/footer-landing'
import { ExitIntentCompassModal } from '@/components/marketing/exit-intent-compass-modal'
import { isSchoolDomain } from '@/lib/site-mode'

export default async function ProgramLayout({ children }: { children: React.ReactNode }) {
  const hideSchoolCta = await isSchoolDomain()
  return (
    <>
      <Navbar hideSchoolRegistration={hideSchoolCta} />
      {children}
      <ExitIntentCompassModal />
    </>
  )
}
