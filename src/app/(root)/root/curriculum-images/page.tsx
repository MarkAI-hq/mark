import { Metadata } from 'next'
import { listCurriculumImages } from '@/lib/actions/curriculum-images'
import { ImageLibraryClient } from '@/app/(dashboard)/dashboard/curriculum-images/_components/image-library-client'

export const metadata: Metadata = { title: 'Image Library — Mark Platform' }

export default async function RootCurriculumImagesPage() {
  const { data: images } = await listCurriculumImages({ limit: 100 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Image Library</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Manage curriculum images available platform-wide. Root-only write access.
        </p>
      </div>
      <ImageLibraryClient initialImages={images ?? []} />
    </div>
  )
}
