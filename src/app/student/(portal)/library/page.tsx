import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLibraryResources } from '@/lib/actions/library'
import { LibraryClient } from './_components/library-client'

export default async function LibraryPage() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')?.value
  if (!userCookie) redirect('/student/login')

  const { data, error } = await getLibraryResources({})

  return <LibraryClient initial={data ?? []} error={error?.message ?? null} />
}
