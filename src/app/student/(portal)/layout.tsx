// src/app/student/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { StudentNav } from '@/components/students/student-nav'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userCookie  = cookieStore.get('user')?.value

  if (!userCookie) redirect('/student/login')

  let user: any = null
  try {
    user = JSON.parse(decodeURIComponent(userCookie))
  } catch {
    redirect('/student/login')
  }

  if (!user?.roles?.includes('Student')) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface-raised/40">
      <StudentNav user={user} />
      <main className="container mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}