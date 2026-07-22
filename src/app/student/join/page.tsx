import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { JoinClient } from './_components/join-client'
import { getPublicSchoolProfile } from '@/lib/actions/enrollment'

export const metadata = {
  title: 'Join · Mirror Intelligence',
}

export default async function StudentJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>
}) {
  const params = await searchParams
  const explicitSchoolCode = params.school?.toUpperCase()
  const schoolCode =
    explicitSchoolCode ||
    process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE ||
    'MCS-2026'
  // Return to the specific school profile the student came from, not the generic
  // marketing homepage — only fall back to the directory when we have no school context.
  const backHref = explicitSchoolCode ? `/schools/${explicitSchoolCode}` : '/schools'

  const { data: school } = await getPublicSchoolProfile(schoolCode)
  const schoolName = school?.name || schoolCode

  return (
    <main className="min-h-screen bg-surface-base">
      <div className="mx-auto flex max-w-2xl items-center px-4 pt-6 sm:px-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#926C15] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>
      <div className="flex items-start justify-center px-4 py-10">
        <JoinClient schoolCode={schoolCode} schoolName={schoolName} />
      </div>
    </main>
  )
}
