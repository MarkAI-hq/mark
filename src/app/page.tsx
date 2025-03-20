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
      {/* <div className='flex-1 space-y-4 p-8 pt-6'>
        <h1 className='text-3xl font-bold tracking-tight'>Welcome to Mark</h1>
        <p className='text-lg'>
          This is the home page. Please <Link href='/login' className='text-blue-500 hover:underline'>login</Link> to access your dashboard.
        </p>
        <Footer />
      </div> */}
      <Footer/>
    </>
  )
}