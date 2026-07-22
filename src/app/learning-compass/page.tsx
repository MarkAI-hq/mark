import { Metadata } from 'next'
import { getPublicCompassStructure } from '@/lib/actions/public-compass'
import { LearningCompassPublicClient } from './_components/learning-compass-public-client'

export const metadata: Metadata = {
  title: 'The Learning Compass — Mirror Intelligence',
  description:
    'A free, two-minute assessment of how you learn best — get your learning profile and a personalised toolkit, no sign-up required.',
}

export default async function LearningCompassPage() {
  const { data: structure, error } = await getPublicCompassStructure()

  if (error || !structure) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">
          The Learning Compass isn&apos;t available right now — please try again shortly.
        </p>
      </div>
    )
  }

  return <LearningCompassPublicClient structure={structure} />
}
