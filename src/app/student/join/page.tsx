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
    <main className="min-h-screen bg-surface-base flex items-start justify-center px-4 py-10">
      <JoinClient schoolCode={schoolCode} />
    </main>
  )
}
