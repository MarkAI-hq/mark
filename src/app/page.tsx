import { Metadata } from 'next'
import { HeroSection } from '@/components/layout/sections/hero'
import { Navbar } from '../components/layout/sections/navbar'
import SponsorsSection from '@/components/layout/sections/sponsors'
import { FooterSection } from '@/components/nav/footer-landing'
import { FAQSection } from '@/components/layout/sections/faq'
import { FeaturesSection } from '@/components/layout/sections/features'
import Header from '@/components/layout/sections/header'
import {OurStory} from '@/components/layout/sections/ourstory'

export const metadata: Metadata = {
  title: 'Home - Mark',
  description: 'Welcome to Mark'
}

export default function HomePage() {
  return (
    <>
      <Navbar/>
      <HeroSection />
      <OurStory/>
      <SponsorsSection />
      <FeaturesSection />
      <Header />
      <FAQSection />
      <FooterSection/>
    </>
  )
}