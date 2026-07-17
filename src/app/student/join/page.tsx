import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { JoinClient } from './_components/join-client'

export const metadata = {
  title: 'Join · Mirror Intelligence',
}

export default async function StudentJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>
}) {
  const params = await searchParams
  const schoolCode =
    params.school?.toUpperCase() ||
    process.env.NEXT_PUBLIC_DEFAULT_SCHOOL_CODE ||
    'MCS-2026'

  return (
    <main className="min-h-screen bg-surface-base">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-6 sm:px-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#926C15] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/student/login" className="font-semibold text-[#926C15] hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
      <div className="flex items-start justify-center px-4 py-10">
        <JoinClient schoolCode={schoolCode} />
      </div>
    </main>
  )
}
