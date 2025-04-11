import { Footer } from '@/components/nav/footer'
import { Metadata } from 'next'
import { HeroSection } from '@/components/layout/sections/hero'

export const metadata: Metadata = {
  title: 'Home - Mark',
  description: 'Welcome to Mark'
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Footer/>
    </>
  )
}