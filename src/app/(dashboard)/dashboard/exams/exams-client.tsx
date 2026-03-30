'use client'

// src/app/(dashboard)/dashboard/exams/exams-client.tsx

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams }          from 'next/navigation'
import { toast }      from 'sonner'
import { Plus }       from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'

import { Button }        from '@/components/ui/button'
import { ExamsTable }    from '@/components/exams/exams-table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ExamDialog }    from '@/components/exams/exam-dialog'
import { Assessment, deleteAssessment, publishAssessment } from '@/lib/actions/assessments'
import { getSubjects } from '@/lib/actions/subjects'

type SubjectOption = { id: string; name: string }

interface ExamsClientProps {
  assessments: Assessment[]
  subjects:    SubjectOption[]
  classes:     { class_id: string; name: string }[]
  role?:       'Admin' | 'Teacher'
}

function normaliseSubjects(raw: any[]): SubjectOption[] {
  return raw
    .map((s) => ({ id: s.subject_id ?? s.id, name: s.name }))
    .filter((s): s is SubjectOption => Boolean(s.id && s.name))
}

export function ExamsClient({ assessments, subjects, classes, role = 'Admin' }: ExamsClientProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [assessmentList,     setAssessmentList]     = useState<Assessment[]>(assessments)
  const [subjectList,        setSubjectList]        = useState<SubjectOption[]>(subjects)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | undefined>()
  const [dialogOpen,         setDialogOpen]         = useState(false)
  const [deleteDialogOpen,   setDeleteDialogOpen]   = useState(false)
  const [isPending,          startTransition]       = useTransition()

  // Auto-open create dialog when arriving from ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setSelectedAssessment(undefined)
      setDialogOpen(true)
      router.replace('/dashboard/exams')
    }
  }, [searchParams, router])

  const resetState = () => {
    setSelectedAssessment(undefined)
    setDialogOpen(false)
    setDeleteDialogOpen(false)
  }

  const refreshSubjects = async () => {
    const { data } = await getSubjects()
    if (data) setSubjectList(normaliseSubjects(data as any[]))
  }

  const handleOpenNewDialog = async () => {
    setSelectedAssessment(undefined)
    setDialogOpen(true)
    await refreshSubjects()
  }

  const handleOpenEditDialog = async (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setDialogOpen(true)
    await refreshSubjects()
  }

  useHotkeys('n',      handleOpenNewDialog, { preventDefault: true })
  useHotkeys('escape', resetState,          { preventDefault: true })

  const handleDelete = () => {
    if (!selectedAssessment) return
    toast.promise(deleteAssessment(selectedAssessment.assessment_id), {
      loading: 'Deleting assessment...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message)
        startTransition(() => {
          setAssessmentList((prev) =>
            prev.filter((a) => a.assessment_id !== selectedAssessment.assessment_id),
          )
        })
        resetState()
        return res.data?.message ?? 'Assessment deleted.'
      },
      error: (err) => err.message ?? 'Failed to delete.',
    })
  }

  const handlePublish = (assessment: Assessment) => {
    toast.promise(publishAssessment(assessment.assessment_id), {
      loading: 'Publishing...',
      success: (res) => {
        if (res.error) throw new Error(res.error.message)
        startTransition(() => {
          setAssessmentList((prev) =>
            prev.map((a) =>
              a.assessment_id === assessment.assessment_id
                ? { ...a, is_published: true }
                : a,
            ),
          )
        })
        return `"${assessment.title}" is now published.`
      },
      error: (err) => err.message ?? 'Failed to publish.',
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Button onClick={handleOpenNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <ExamsTable
        data={assessmentList}
        onEdit={handleOpenEditDialog}
        onDelete={(assessment) => {
          setSelectedAssessment(assessment)
          setDeleteDialogOpen(true)
        }}
        onPublish={handlePublish}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete assessment?"
        description={`This will permanently delete "${selectedAssessment?.title ?? 'this assessment'}" and all associated data. This cannot be undone.`}
        confirmText={isPending ? 'Deleting...' : 'Yes, Delete'}
        isDestructive
      />

      <ExamDialog
        key={selectedAssessment?.assessment_id ?? 'new'}
        open={dialogOpen}
        subjects={subjectList}
        classes={classes}
        assessment={selectedAssessment}
        role={role}
        onOpenChange={(open) => {
          if (!open) resetState()
          else setDialogOpen(true)
        }}
      />
    </>
  )
}