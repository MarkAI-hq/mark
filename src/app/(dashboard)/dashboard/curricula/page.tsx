import { Library } from 'lucide-react'
import { getCurricula } from '@/lib/actions/curricula'
import { CurriculumLibraryClient } from './_components/curriculum-library-client'

export default async function CurriculaPage() {
  const { data: curricula, error } = await getCurricula()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Library className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Curriculum Library</h1>
          <p className="text-sm text-muted-foreground">
            All loaded national curriculum schemas — used for SoW generation, exam audit, and gap attribution
          </p>
        </div>
      </div>

      <CurriculumLibraryClient curricula={curricula ?? []} error={error?.message ?? null} />
    </div>
  )
}
