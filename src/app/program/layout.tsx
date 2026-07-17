import { Navbar } from '@/components/layout/sections/navbar'
import { FooterSection } from '@/components/nav/footer-landing'

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <FooterSection />
    </>
  )
}
