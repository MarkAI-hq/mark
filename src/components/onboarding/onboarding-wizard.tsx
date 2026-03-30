'use client'

// src/components/onboarding/onboarding-wizard.tsx

import { useState, useTransition, useCallback } from 'react'
import Image from 'next/image'
import { useRouter }         from 'next/navigation'
import { useForm }           from 'react-hook-form'
import { zodResolver }       from '@hookform/resolvers/zod'
import { z }                 from 'zod'
import { toast }             from 'sonner'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Users,
  BarChart2, FileText, Brain,
} from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { cn }                  from '@/lib/utils'
import { createClass }         from '@/lib/actions/classes'
import { createSubject }       from '@/lib/actions/subjects'
import {
  saveOrganizationSetup,
  completeOnboarding,
}                              from '@/lib/actions/onboarding'
import { StudentImportDialog } from '@/components/students/student-import-dialog'

const SCHOOL_TYPES = [
  { value: 'primary',  label: 'Primary School', sub: 'P1 – P7'          },
  { value: 'o-level',  label: 'O-Level',         sub: 'S1 – S4'          },
  { value: 'a-level',  label: 'A-Level',          sub: 'S5 – S6'          },
  { value: 'combined', label: 'Combined',         sub: 'P1 – S6'          },
  { value: 'other',    label: 'Other',            sub: 'College / Training'},
] as const

const EDUCATION_SYSTEMS = [
  { value: 'uneb',      label: 'Uganda National (UNEB)'      },
  { value: 'cambridge', label: 'Cambridge International'     },
  { value: 'ib',        label: 'International Baccalaureate' },
  { value: 'other',     label: 'Other / Custom'              },
] as const

const DEFAULT_SUBJECTS = [
  'Mathematics',     'English',            'Biology',
  'Chemistry',       'Physics',            'History',
  'Geography',       'Literature',         'Economics',
  'Computer Science','Agriculture',        'Art & Design',
  'Music',           'Physical Education', 'French',
  'Kiswahili',       'Commerce',           'Religious Education',
  'Entrepreneurship',
]

const WIZARD_STEPS = [
  { id: 1, label: 'School'   },
  { id: 2, label: 'Subjects' },
  { id: 3, label: 'Class'    },
  { id: 4, label: 'Students' },
]

const FEATURES = [
  { icon: Brain,    title: 'AI-Powered Grading',      sub: 'Grade entire classes in minutes with 97%+ accuracy.'          },
  { icon: BarChart2, title: 'Deep Learning Analytics', sub: "Track every student's Bloom's taxonomy progression."          },
  { icon: FileText,  title: 'Instant PDF Reports',     sub: 'Generate and export student performance reports in one click.' },
]

const classSchema = z.object({
  name:        z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
})
type ClassData = z.infer<typeof classSchema>

interface OnboardingWizardProps {
  adminName:  string
  schoolName: string
}

export function OnboardingWizard({ adminName, schoolName }: OnboardingWizardProps) {
  const router = useRouter()

  const [step, setStep]           = useState(1)
  const [direction, setDirection] = useState<'fwd' | 'bck'>('fwd')
  const [animKey, setAnimKey]     = useState(0)
  const [isPending, startT]       = useTransition()

  const [schoolType,      setSchoolType]      = useState('')
  const [educationSystem, setEducationSystem] = useState('')

  const [subjects, setSubjects]       = useState<string[]>([])
  const [allSubjects, setAllSubjects] = useState(DEFAULT_SUBJECTS)
  const [customSubject, setCustom]    = useState('')

  const classForm = useForm<ClassData>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: '', description: '' },
  })
  const [createdClassId,   setCreatedClassId]   = useState<string | null>(null)
  const [createdClassName, setCreatedClassName] = useState('')

  const [importOpen,    setImportOpen]    = useState(false)
  const [studentsAdded, setStudentsAdded] = useState(false)

  const navigate = useCallback((target: number, dir: 'fwd' | 'bck') => {
    setDirection(dir)
    setAnimKey(k => k + 1)
    setStep(target)
  }, [])

  const advance = () => navigate(step + 1, 'fwd')
  const retreat = () => navigate(step - 1, 'bck')

  const handleSaveSchool = () => {
    if (!schoolType || !educationSystem) {
      toast.error('Please select both a school type and education system.')
      return
    }
    startT(async () => {
      const { error } = await saveOrganizationSetup({
        type:             schoolType,
        education_system: educationSystem,
      })
      if (error) { toast.error(error.message); return }
      advance()
    })
  }

  const handleSaveSubjects = () => {
    startT(async () => {
      if (subjects.length > 0) {
        const results = await Promise.all(
          subjects.map(name => createSubject({ name }))
        )
        const failed = results.filter(r => r.error)
        if (failed.length > 0) {
          toast.error(`${failed.length} subject(s) failed to save.`)
          return
        }
      }
      advance()
    })
  }

  const handleCreateClass = (data: ClassData) => {
    startT(async () => {
      try {
        const newClass = await createClass({
          name:        data.name,
          description: data.description || null,
        })
        setCreatedClassId(newClass.class_id)
        setCreatedClassName(newClass.name)
        toast.success(`"${newClass.name}" created.`)
        advance()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create class.')
      }
    })
  }

  const handleFinish = () => {
    startT(async () => {
      await completeOnboarding()
      router.push('/dashboard')
    })
  }

  const toggleSubject = (s: string) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const addCustomSubject = () => {
    const val = customSubject.trim()
    if (!val || allSubjects.includes(val)) return
    setAllSubjects(prev => [...prev, val])
    setSubjects(prev => [...prev, val])
    setCustom('')
  }

  const animClass = direction === 'fwd' ? 'wiz-slide-fwd' : 'wiz-slide-bck'

  return (
    <>
      <style>{`
        @keyframes wizFwd {
          from { opacity:0; transform:translateX(32px) }
          to   { opacity:1; transform:translateX(0)    }
        }
        @keyframes wizBck {
          from { opacity:0; transform:translateX(-32px) }
          to   { opacity:1; transform:translateX(0)     }
        }
        .wiz-slide-fwd { animation: wizFwd 0.28s cubic-bezier(0.22,1,0.36,1) both }
        .wiz-slide-bck { animation: wizBck 0.28s cubic-bezier(0.22,1,0.36,1) both }
      `}</style>

      <div className="min-h-screen flex">

        {/* Left panel */}
        <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col gap-8 bg-slate-900 p-16 text-white shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/images/markBlackBg.png"
              alt="Mark logo"
              width={200}
              height={100}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-10">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight">
                The Learning Intelligence platform for schools.
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                Join hundreds of teachers saving hours every week while giving students deeper actionable feedback.
              </p>
            </div>

            <div className="space-y-5">
              {FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <f.icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Mark. All rights reserved.
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-slate-50 flex flex-col">

          <div className="flex lg:hidden items-center gap-2.5 p-6 border-b bg-white">
            <Image
              src="/assets/images/markBlackBg.png"
              alt="Mark logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
          </div>

          <div className="px-6 pt-8 pb-2 max-w-lg mx-auto w-full">
            <div className="flex items-center gap-2 mb-1.5">
              {WIZARD_STEPS.map(s => (
                <div key={s.id} className="flex-1">
                  <div className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    step > s.id   ? 'bg-amber-400' :
                    step === s.id ? 'bg-amber-400/40' : 'bg-slate-200',
                  )} />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Step {step} of {WIZARD_STEPS.length} —{' '}
              <span className="text-slate-600">{WIZARD_STEPS[step - 1].label}</span>
            </p>
          </div>

          <div className="flex-1 flex items-start justify-center px-6 py-8 overflow-hidden">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8" key={animKey}>
              <div className={animClass}>

                {step === 1 && (
                  <StepSchool
                    adminName={adminName}
                    schoolName={schoolName}
                    schoolType={schoolType}
                    setSchoolType={setSchoolType}
                    educationSystem={educationSystem}
                    setEducationSystem={setEducationSystem}
                    onContinue={handleSaveSchool}
                    isPending={isPending}
                  />
                )}

                {step === 2 && (
                  <StepSubjects
                    subjects={subjects}
                    allSubjects={allSubjects}
                    toggleSubject={toggleSubject}
                    customSubject={customSubject}
                    setCustomSubject={setCustom}
                    addCustomSubject={addCustomSubject}
                    onBack={retreat}
                    onContinue={handleSaveSubjects}
                    isPending={isPending}
                  />
                )}

                {step === 3 && (
                  <StepClass
                    form={classForm}
                    onBack={retreat}
                    onSubmit={handleCreateClass}
                    isPending={isPending}
                  />
                )}

                {step === 4 && (
                  <StepStudents
                    classId={createdClassId}
                    className={createdClassName}
                    importOpen={importOpen}
                    setImportOpen={setImportOpen}
                    studentsAdded={studentsAdded}
                    onImportSuccess={() => setStudentsAdded(true)}
                    onBack={retreat}
                    onFinish={handleFinish}
                    isPending={isPending}
                  />
                )}

              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

function StepSchool({
  adminName, schoolName,
  schoolType, setSchoolType,
  educationSystem, setEducationSystem,
  onContinue, isPending,
}: {
  adminName:          string
  schoolName:         string
  schoolType:         string
  setSchoolType:      (v: string) => void
  educationSystem:    string
  setEducationSystem: (v: string) => void
  onContinue:         () => void
  isPending:          boolean
}) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome, {adminName}.</h2>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
          Let's set up{' '}
          <span className="text-slate-800 font-medium">{schoolName}</span>.
          This takes about 2 minutes.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">School type</p>
        <div className="grid grid-cols-2 gap-2">
          {SCHOOL_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSchoolType(t.value)}
              className={cn(
                'flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all duration-150 cursor-pointer',
                schoolType === t.value
                  ? 'border-amber-400 bg-amber-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <span className={cn(
                'font-semibold text-sm',
                schoolType === t.value ? 'text-amber-700' : 'text-slate-800',
              )}>
                {t.label}
              </span>
              <span className="text-xs mt-0.5 text-slate-400">{t.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Education system</p>
        <div className="grid grid-cols-2 gap-2">
          {EDUCATION_SYSTEMS.map(e => (
            <button
              key={e.value}
              type="button"
              onClick={() => setEducationSystem(e.value)}
              className={cn(
                'px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-150 cursor-pointer',
                educationSystem === e.value
                  ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onContinue}
        disabled={isPending || !schoolType || !educationSystem}
        size="lg"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
      >
        {isPending ? 'Saving…' : 'Continue'}
        {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  )
}

function StepSubjects({
  subjects, allSubjects, toggleSubject,
  customSubject, setCustomSubject, addCustomSubject,
  onBack, onContinue, isPending,
}: {
  subjects:         string[]
  allSubjects:      string[]
  toggleSubject:    (s: string) => void
  customSubject:    string
  setCustomSubject: (v: string) => void
  addCustomSubject: () => void
  onBack:           () => void
  onContinue:       () => void
  isPending:        boolean
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Which subjects do you teach?</h2>
        <p className="text-slate-500 mt-1.5 text-sm">Select all that apply. You can update this anytime.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {allSubjects.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggleSubject(s)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer',
              subjects.includes(s)
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={customSubject}
          onChange={e => setCustomSubject(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubject())}
          placeholder="Add a subject…"
        />
        <Button type="button" variant="outline" onClick={addCustomSubject} className="shrink-0">
          Add
        </Button>
      </div>

      {subjects.length > 0 && (
        <p className="text-xs text-slate-400">
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} selected
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} size="lg" className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onContinue}
          disabled={isPending}
          size="lg"
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
        >
          {isPending ? 'Creating subjects…' : subjects.length === 0 ? 'Skip' : 'Continue'}
          {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

function StepClass({
  form, onBack, onSubmit, isPending,
}: {
  form:      ReturnType<typeof useForm<ClassData>>
  onBack:    () => void
  onSubmit:  (data: ClassData) => void
  isPending: boolean
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Create your first class.</h2>
        <p className="text-slate-500 mt-1.5 text-sm">
          e.g.{' '}
          <span className="text-slate-700">"Form 4 East"</span>
          {' '}or{' '}
          <span className="text-slate-700">"S3 Science A"</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Form 4 East" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of this class."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack} size="lg" className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isPending ? 'Creating…' : 'Create Class'}
              {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function StepStudents({
  classId, className,
  importOpen, setImportOpen,
  studentsAdded, onImportSuccess,
  onBack, onFinish, isPending,
}: {
  classId:         string | null
  className:       string
  importOpen:      boolean
  setImportOpen:   (v: boolean) => void
  studentsAdded:   boolean
  onImportSuccess: () => void
  onBack:          () => void
  onFinish:        () => void
  isPending:       boolean
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Add students to{' '}
          <span className="text-amber-600">{className}</span>.
        </h2>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
          Import from a CSV. PINs are auto-generated and shown on a printable credential sheet — shown once only.
        </p>
      </div>

      {studentsAdded ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-emerald-800 font-semibold text-sm">Students imported successfully.</p>
            <p className="text-emerald-600 text-xs mt-0.5 leading-relaxed">
              PINs have been generated. Hand out the credential sheet and you're done.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => classId && setImportOpen(true)}
          disabled={!classId}
          className={cn(
            'w-full p-6 rounded-xl border-2 border-dashed text-left transition-all duration-150',
            classId
              ? 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer'
              : 'border-slate-100 opacity-40 cursor-not-allowed',
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-slate-800 font-semibold">Import from CSV</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed pl-12">
            Upload a spreadsheet with student names. PINs are auto-generated and shown on a printable sheet.
          </p>
        </button>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} size="lg" className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onFinish}
          disabled={isPending}
          size="lg"
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
        >
          {isPending
            ? 'Almost there…'
            : studentsAdded
            ? 'Go to Dashboard'
            : 'Skip, go to Dashboard'}
          {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      {classId && (
        <StudentImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          classId={classId}
          onImportSuccess={onImportSuccess}
        />
      )}
    </div>
  )
}