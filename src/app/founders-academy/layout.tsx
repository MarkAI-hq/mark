import { Navbar } from '@/components/layout/sections/navbar'
import { FooterSection } from '@/components/nav/footer-landing'
import { isSchoolDomain } from '@/lib/site-mode'

export default async function FoundersAcademyLayout({ children }: { children: React.ReactNode }) {
  const isSchoolSite = await isSchoolDomain()
  return (
    <>
      <Navbar isSchoolSite={isSchoolSite} />
      {children}
      <FooterSection hideSchoolCta={isSchoolSite} />
    </>
  )
}
