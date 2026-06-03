import { Library } from 'lucide-react'
import { redirect }      from 'next/navigation'
import { getSession }    from '@/lib/session'
import { getCurricula }  from '@/lib/actions/curricula'
import { getMyCoursesAsSubjects } from '@/lib/actions/classes'
import { CurriculumLibraryClient } from './_components/curriculum-library-client'

export default async function CurriculaPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const { data: curricula, error } = await getCurricula()

  // Teachers only see curricula that match their assigned subjects
  let filtered = curricula ?? []
  if (session.role === 'Teacher') {
    const { data: mySubjects } = await getMyCoursesAsSubjects()
    if (mySubjects && mySubjects.length > 0) {
      const names = new Set(mySubjects.map(s => s.name.toLowerCase()))
      filtered = filtered.filter(c => names.has(c.subject.toLowerCase()))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Library className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Curriculum Library</h1>
          <p className="text-sm text-muted-foreground">
            {session.role === 'Teacher'
              ? 'Curriculum schemas for your assigned subjects'
              : 'All loaded national curriculum schemas — used for SoW generation, exam audit, and gap attribution'}
          </p>
        </div>
      </div>

      <CurriculumLibraryClient curricula={filtered} error={error?.message ?? null} />
    </div>
  )
}
