import { Navbar } from '@/components/layout/sections/navbar'
import { FooterSection } from '@/components/nav/footer-landing'
import { isSchoolDomain } from '@/lib/site-mode'

export default async function LearningCompassLayout({ children }: { children: React.ReactNode }) {
  const hideSchoolCta = await isSchoolDomain()
  return (
    <>
      <Navbar hideSchoolRegistration={hideSchoolCta} />
      {children}
      <FooterSection hideSchoolCta={hideSchoolCta} />
    </>
  )
}
