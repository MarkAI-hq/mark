'use client'

// src/components/onboarding/onboarding-wizard.tsx

import { useState, useTransition, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Users,
  BarChart2, FileText, Brain, BookOpen, GraduationCap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getAvailableSubjects, type AvailableSubject } from '@/lib/actions/curricula'
import { cn } from '@/lib/utils'
import { createClass } from '@/lib/actions/classes'
import { createSubjects } from '@/lib/actions/subjects'
import { saveOrganizationSetup, completeOnboarding } from '@/lib/actions/onboarding'
import { StudentImportDialog } from '@/components/students/student-import-dialog'

// ── Static config ──────────────────────────────────────────────────────────

const SCHOOL_TYPES = [
  { value: 'primary',  label: 'Primary School', sub: 'P1 – P7'           },
  { value: 'o-level',  label: 'O-Level',         sub: 'S1 – S4'           },
  { value: 'a-level',  label: 'A-Level',          sub: 'S5 – S6'           },
  { value: 'combined', label: 'Combined',         sub: 'P1 – S6'           },
  { value: 'other',    label: 'Other',            sub: 'College / Training' },
] as const

const EDUCATION_SYSTEMS = [
  { value: 'uneb',      label: 'Uganda National (UNEB)'      },
  { value: 'cambridge', label: 'Cambridge International'     },
  { value: 'ib',        label: 'International Baccalaureate' },
  { value: 'other',     label: 'Other / Custom'              },
] as const

// ── Default classes per school type ───────────────────────────────────────

const DEFAULT_CLASSES: Record<string, string[]> = {
  primary:  ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
  'o-level': ['S1', 'S2', 'S3', 'S4'],
  'a-level': ['S5', 'S6'],
  combined:  ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  other:     [],
}

// ── Default subjects per school type × education system ────────────────────

type SchoolTypeKey = 'primary' | 'o-level' | 'a-level' | 'combined' | 'other'
type EduSystemKey  = 'uneb' | 'cambridge' | 'ib' | 'other'

// Subject metadata auto-enriches default subjects with codes + descriptions.
// Matched case-insensitively against DEFAULT_SUBJECTS names at creation time.
const SUBJECT_METADATA: Record<string, { code: string; description: string }> = {
  'Mathematics':                   { code: 'MTH',  description: 'Numbers, algebra, geometry, statistics and problem solving.' },
  'Subsidiary Mathematics':        { code: 'SMTH', description: 'Core mathematical concepts for non-specialist students.' },
  'Further Mathematics':           { code: 'FMTH', description: 'Advanced mathematics including calculus and complex numbers.' },
  'English':                       { code: 'ENG',  description: 'Reading, writing, grammar, communication and literature.' },
  'English Language':              { code: 'ENG',  description: 'Reading, writing, grammar and communication skills.' },
  'English Literature':            { code: 'ELIT', description: 'Study of prose, poetry and drama texts.' },
  'English Language & Literature': { code: 'ELL',  description: 'Combined study of language and literary texts.' },
  'Biology':                       { code: 'BIO',  description: 'Living organisms, ecosystems, genetics and human biology.' },
  'Chemistry':                     { code: 'CHEM', description: 'Matter, reactions, atomic structure and organic chemistry.' },
  'Physics':                       { code: 'PHY',  description: 'Forces, energy, waves, electricity and the universe.' },
  'Science':                       { code: 'SCI',  description: 'Integrated study of biology, chemistry and physics.' },
  'History':                       { code: 'HIST', description: 'Past events, civilisations, politics and social change.' },
  'Geography':                     { code: 'GEOG', description: 'Physical landscapes, human settlements and the environment.' },
  'Literature':                    { code: 'LIT',  description: 'Study of prose, poetry and drama texts.' },
  'Commerce':                      { code: 'COM',  description: 'Trade, business operations and economic activity.' },
  'Economics':                     { code: 'ECON', description: 'Production, consumption, markets and economic policy.' },
  'Agriculture':                   { code: 'AGRI', description: 'Crop production, livestock, soil science and farm management.' },
  'Religious Education':           { code: 'RE',   description: 'World religions, ethics, morality and spiritual development.' },
  'Divinity':                      { code: 'DIV',  description: 'Biblical studies, theology and Christian ethics.' },
  'Computer Studies':              { code: 'CS',   description: 'Computing fundamentals, programming, data and networks.' },
  'Computer Science':              { code: 'CS',   description: 'Algorithms, programming, data structures and systems.' },
  'ICT':                           { code: 'ICT',  description: 'Information and communication technology skills and applications.' },
  'Kiswahili':                     { code: 'KIS',  description: 'Swahili language, grammar, reading and writing.' },
  'French':                        { code: 'FRE',  description: 'French language, grammar, reading, writing and culture.' },
  'Physical Education':            { code: 'PE',   description: 'Sport, fitness, health and physical development.' },
  'Social Studies':                { code: 'SS',   description: 'Society, culture, civics, geography and history.' },
  'Local Language':                { code: 'LL',   description: 'Mother tongue and regional language literacy.' },
  'General Paper':                 { code: 'GP',   description: 'Critical thinking, current affairs and essay writing.' },
  'Humanities':                    { code: 'HUM',  description: 'Integrated study of history, geography and social sciences.' },
  'Arts':                          { code: 'ART',  description: 'Visual arts, creativity and aesthetic expression.' },
  'Visual Arts':                   { code: 'VART', description: 'Drawing, painting, design and visual expression.' },
  'Individuals & Societies':       { code: 'IS',   description: 'Social sciences, history and geography combined.' },
  'Theory of Knowledge':           { code: 'TOK',  description: 'Epistemology, critical thinking and knowledge frameworks.' },
}

const DEFAULT_SUBJECTS: Record<SchoolTypeKey, Record<EduSystemKey, string[]>> = {
  primary: {
    uneb:      ['English', 'Mathematics', 'Science', 'Social Studies', 'Religious Education', 'Kiswahili', 'Local Language', 'Physical Education'],
    cambridge: ['English', 'Mathematics', 'Science', 'ICT', 'Social Studies'],
    ib:        ['English', 'Mathematics', 'Science', 'Individuals & Societies', 'Arts'],
    other:     ['English', 'Mathematics', 'Science', 'Social Studies'],
  },
  'o-level': {
    uneb:      ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Literature', 'Commerce', 'Agriculture', 'Religious Education', 'Computer Studies', 'Kiswahili', 'French', 'Physical Education'],
    cambridge: ['Mathematics', 'English Language', 'English Literature', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics', 'Computer Science', 'French', 'Physical Education'],
    ib:        ['English Language & Literature', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'History', 'Geography', 'Visual Arts', 'French'],
    other:     ['Mathematics', 'English', 'Science', 'Humanities', 'ICT'],
  },
  'a-level': {
    uneb:      ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Geography', 'History', 'Literature', 'Divinity', 'Computer Studies', 'General Paper', 'Subsidiary Mathematics', 'Kiswahili', 'French'],
    cambridge: ['Mathematics', 'Further Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'History', 'Geography', 'English Literature', 'Computer Science'],
    ib:        ['English Language & Literature', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'History', 'Geography', 'Visual Arts', 'French', 'Theory of Knowledge'],
    other:     ['Mathematics', 'English', 'Sciences', 'Humanities', 'ICT'],
  },
  combined: {
    uneb:      ['English', 'Mathematics', 'Science', 'Social Studies', 'Religious Education', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Literature', 'Commerce', 'Agriculture', 'Computer Studies', 'General Paper'],
    cambridge: ['English', 'Mathematics', 'Science', 'ICT', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics', 'Computer Science', 'French'],
    ib:        ['English Language & Literature', 'Mathematics', 'Science', 'Individuals & Societies', 'Physics', 'Chemistry', 'Biology', 'Economics', 'History', 'Geography', 'Visual Arts'],
    other:     ['English', 'Mathematics', 'Science', 'Social Studies', 'Humanities', 'ICT'],
  },
  other: {
    uneb:      ['English', 'Mathematics', 'Science', 'Humanities', 'ICT'],
    cambridge: ['English', 'Mathematics', 'Science', 'Humanities', 'ICT'],
    ib:        ['English', 'Mathematics', 'Science', 'Humanities', 'ICT'],
    other:     ['English', 'Mathematics', 'Science', 'Humanities', 'ICT'],
  },
}

function deriveCountry(sys: string): string | null {
  return sys === 'uneb' ? 'uganda' : null
}

function deriveClassKeyPrefix(type: string): string | undefined {
  if (type === 'primary') return 'P'
  if (type === 'o-level' || type === 'a-level') return 'S'
  return undefined
}

const WIZARD_STEPS = [
  { id: 1, label: 'School'   },
  { id: 2, label: 'Students' },
]

const FEATURES = [
  { icon: Brain,     title: 'AI-Powered Grading',      sub: 'Grade entire classes in minutes with 97%+ accuracy.'           },
  { icon: BarChart2, title: 'Deep Learning Analytics',  sub: "Track every student's Bloom's taxonomy progression."           },
  { icon: FileText,  title: 'Instant PDF Reports',      sub: 'Generate and export student performance reports in one click.' },
]

// ── Created entity summary ─────────────────────────────────────────────────

interface CreatedClass {
  class_id: string
  name:     string
}

interface OnboardingWizardProps {
  adminName:  string
  schoolName: string
}

export function OnboardingWizard({ adminName, schoolName }: OnboardingWizardProps) {
  const router = useRouter()

  const [step,      setStep]      = useState(1)
  const [direction, setDirection] = useState<'fwd' | 'bck'>('fwd')
  const [animKey,   setAnimKey]   = useState(0)
  const [isPending, startT]       = useTransition()

  const [schoolType,      setSchoolType]      = useState('')
  const [educationSystem, setEducationSystem] = useState('')

  const [apiSubjects,        setApiSubjects]        = useState<AvailableSubject[] | null>(null)
  const [apiSubjectsLoading, setApiSubjectsLoading] = useState(false)
  const [checkedSubjects,    setCheckedSubjects]    = useState<Record<string, boolean>>({})

  // What was auto-created after Step 1
  const [createdClasses,  setCreatedClasses]  = useState<CreatedClass[]>([])
  const [createdSubjects, setCreatedSubjects] = useState<string[]>([])

  // Per-class import state: classId → open?
  const [importOpen, setImportOpen] = useState<Record<string, boolean>>({})
  const [imported,   setImported]   = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!schoolType || !educationSystem) {
      setApiSubjects(null)
      setCheckedSubjects({})
      return
    }
    const country = deriveCountry(educationSystem)
    if (!country) {
      setApiSubjects([])
      setCheckedSubjects({})
      return
    }
    setApiSubjectsLoading(true)
    getAvailableSubjects({ country, classKeyPrefix: deriveClassKeyPrefix(schoolType) }).then(({ data }) => {
      setApiSubjectsLoading(false)
      if (!data?.length) {
        setApiSubjects([])
        setCheckedSubjects({})
        return
      }
      setApiSubjects(data)
      setCheckedSubjects(Object.fromEntries(data.map(s => [s.subject_key, true])))
    })
  }, [schoolType, educationSystem])

  const navigate = useCallback((target: number, dir: 'fwd' | 'bck') => {
    setDirection(dir)
    setAnimKey(k => k + 1)
    setStep(target)
  }, [])

  const retreat = () => navigate(step - 1, 'bck')

  // ── Step 1 submit ──────────────────────────────────────────────────────

  const handleSaveSchool = () => {
    if (!schoolType || !educationSystem) {
      toast.error('Please select both a school type and education system.')
      return
    }

    startT(async () => {
      // 1. Save org setup
      const { error: orgError } = await saveOrganizationSetup({
        type:             schoolType,
        education_system: educationSystem,
      })
      if (orgError) { toast.error(orgError.message); return }

      // 2. Create subjects — use curriculum DB list if available, else hardcoded defaults
      const useApi = apiSubjects && apiSubjects.length > 0
      const subjectsPayload = useApi
        ? apiSubjects!
            .filter(s => checkedSubjects[s.subject_key])
            .map(s => ({
              name: s.display_name,
              ...(SUBJECT_METADATA[s.display_name] ?? {}),
            }))
        : (DEFAULT_SUBJECTS[schoolType as SchoolTypeKey]?.[educationSystem as EduSystemKey] ?? [])
            .map(name => ({ name, ...SUBJECT_METADATA[name] }))

      if (subjectsPayload.length > 0) {
        const { error: subjectsError } = await createSubjects(subjectsPayload)
        if (subjectsError) {
          toast.warning(`Subjects could not be saved — you can add them later. (${subjectsError.message})`)
        } else {
          setCreatedSubjects(subjectsPayload.map(s => s.name))
        }
      }

      // 3. Create classes
      const classNames = DEFAULT_CLASSES[schoolType] ?? []
      const classResults = await Promise.allSettled(
        classNames.map(name =>
          createClass({ name, grade_level: name })
        )
      )

      const created: CreatedClass[] = []
      let classFailCount = 0
      for (const result of classResults) {
        if (result.status === 'fulfilled') {
          created.push({ class_id: result.value.class_id, name: result.value.name })
        } else {
          classFailCount++
        }
      }
      if (classFailCount > 0) {
        toast.warning(`${classFailCount} class(es) failed to create — you can add them later.`)
      }
      setCreatedClasses(created)

      navigate(2, 'fwd')
    })
  }

  // ── Step 2 finish ──────────────────────────────────────────────────────

  const handleFinish = () => {
    startT(async () => {
      await completeOnboarding()
      router.push('/dashboard')
    })
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
                Mirror Intelligence for schools.
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

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 p-6 border-b bg-white">
            <Image
              src="/assets/images/markBlackBg.png"
              alt="Mark logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
          </div>

          {/* Progress */}
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

          {/* Step content */}
          <div className="flex-1 flex items-start justify-center px-6 py-8 overflow-hidden">
            <div
              className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
              key={animKey}
            >
              <div className={animClass}>

                {step === 1 && (
                  <StepSchool
                    adminName={adminName}
                    schoolName={schoolName}
                    schoolType={schoolType}
                    setSchoolType={setSchoolType}
                    educationSystem={educationSystem}
                    setEducationSystem={setEducationSystem}
                    apiSubjects={apiSubjects}
                    apiSubjectsLoading={apiSubjectsLoading}
                    checkedSubjects={checkedSubjects}
                    onToggleSubject={key =>
                      setCheckedSubjects(prev => ({ ...prev, [key]: !prev[key] }))
                    }
                    onToggleAll={all =>
                      setCheckedSubjects(
                        Object.fromEntries((apiSubjects ?? []).map(s => [s.subject_key, all]))
                      )
                    }
                    onContinue={handleSaveSchool}
                    isPending={isPending}
                  />
                )}

                {step === 2 && (
                  <StepStudents
                    createdClasses={createdClasses}
                    createdSubjectCount={createdSubjects.length}
                    importOpen={importOpen}
                    setImportOpen={(classId, open) =>
                      setImportOpen(prev => ({ ...prev, [classId]: open }))
                    }
                    imported={imported}
                    onImportSuccess={classId =>
                      setImported(prev => ({ ...prev, [classId]: true }))
                    }
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

// ── Step 1: School ─────────────────────────────────────────────────────────

function StepSchool({
  adminName, schoolName,
  schoolType, setSchoolType,
  educationSystem, setEducationSystem,
  apiSubjects, apiSubjectsLoading, checkedSubjects,
  onToggleSubject, onToggleAll,
  onContinue, isPending,
}: {
  adminName:             string
  schoolName:            string
  schoolType:            string
  setSchoolType:         (v: string) => void
  educationSystem:       string
  setEducationSystem:    (v: string) => void
  apiSubjects:           AvailableSubject[] | null
  apiSubjectsLoading:    boolean
  checkedSubjects:       Record<string, boolean>
  onToggleSubject:       (key: string) => void
  onToggleAll:           (all: boolean) => void
  onContinue:            () => void
  isPending:             boolean
}) {
  const previewClasses  = schoolType ? (DEFAULT_CLASSES[schoolType] ?? []) : []
  const previewSubjects = (schoolType && educationSystem)
    ? (DEFAULT_SUBJECTS[schoolType as SchoolTypeKey]?.[educationSystem as EduSystemKey] ?? [])
    : []
  const checkedCount = apiSubjects ? apiSubjects.filter(s => checkedSubjects[s.subject_key]).length : 0

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome, {adminName}.</h2>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
          Let&apos;s set up{' '}
          <span className="text-slate-800 font-medium">{schoolName}</span>.
          This takes about a minute.
        </p>
      </div>

      {/* School type */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          School type
        </p>
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

      {/* Education system */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Education system
        </p>
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

      {/* Subject selection — curriculum-driven checklist or fallback preview */}
      {apiSubjectsLoading && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-slate-400">Loading available subjects…</p>
        </div>
      )}

      {!apiSubjectsLoading && apiSubjects && apiSubjects.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {checkedCount} of {apiSubjects.length} subjects selected
            </p>
            <button
              type="button"
              className="text-xs text-amber-700 underline"
              onClick={() => onToggleAll(checkedCount !== apiSubjects.length)}
            >
              {checkedCount === apiSubjects.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {apiSubjects.map(s => (
              <label
                key={s.subject_key}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer"
              >
                <Checkbox
                  checked={!!checkedSubjects[s.subject_key]}
                  onCheckedChange={() => onToggleSubject(s.subject_key)}
                />
                <span className="text-sm text-slate-700">{s.display_name}</span>
                <span className="text-xs text-slate-400 ml-auto">{s.class_levels.join(', ')}</span>
              </label>
            ))}
          </div>
          {previewClasses.length > 0 && (
            <p className="text-xs text-slate-400 pt-1">
              {previewClasses.length} classes will also be created ({previewClasses.join(', ')}).
            </p>
          )}
        </div>
      )}

      {!apiSubjectsLoading && !(apiSubjects && apiSubjects.length > 0) &&
        (previewClasses.length > 0 || previewSubjects.length > 0) && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            We&apos;ll set up for you
          </p>
          {previewClasses.length > 0 && (
            <div className="flex items-start gap-2.5">
              <GraduationCap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {previewClasses.length} classes
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {previewClasses.join(', ')}
                </p>
              </div>
            </div>
          )}
          {previewSubjects.length > 0 && (
            <div className="flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {previewSubjects.length} subjects
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {previewSubjects.join(', ')}
                </p>
              </div>
            </div>
          )}
          <p className="text-xs text-slate-400 pt-1">
            You can edit or add to these anytime from your dashboard.
          </p>
        </div>
      )}

      <Button
        onClick={onContinue}
        disabled={isPending || apiSubjectsLoading || !schoolType || !educationSystem}
        size="lg"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
      >
        {isPending ? 'Setting up your school…' : 'Continue'}
        {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  )
}

// ── Step 2: Students ───────────────────────────────────────────────────────

function StepStudents({
  createdClasses,
  createdSubjectCount,
  importOpen,
  setImportOpen,
  imported,
  onImportSuccess,
  onBack,
  onFinish,
  isPending,
}: {
  createdClasses:     CreatedClass[]
  createdSubjectCount: number
  importOpen:         Record<string, boolean>
  setImportOpen:      (classId: string, open: boolean) => void
  imported:           Record<string, boolean>
  onImportSuccess:    (classId: string) => void
  onBack:             () => void
  onFinish:           () => void
  isPending:          boolean
}) {
  const totalImported = Object.values(imported).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Your school is ready.</h2>
        <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
          We&apos;ve created your classes and subjects. Now add students — or skip and do it later.
        </p>
      </div>

      {/* Confirmation banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Default configuration created</p>
        </div>
        <ul className="text-xs text-emerald-700 space-y-0.5 pl-6 list-disc">
          {createdClasses.length > 0 && (
            <li>{createdClasses.length} classes: {createdClasses.map(c => c.name).join(', ')}</li>
          )}
          {createdSubjectCount > 0 && (
            <li>{createdSubjectCount} subjects added to your curriculum</li>
          )}
        </ul>
        <p className="text-xs text-emerald-600 pl-0">
          You can rename, delete, or add more from the dashboard anytime.
        </p>
      </div>

      {/* Class list for import */}
      {createdClasses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Add students by class
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {createdClasses.map(cls => (
              <div
                key={cls.class_id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center gap-2.5">
                  {imported[cls.class_id] ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-slate-800">{cls.name}</span>
                  {imported[cls.class_id] && (
                    <span className="text-xs text-emerald-600">Students added</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setImportOpen(cls.class_id, true)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                    imported[cls.class_id]
                      ? 'text-slate-400 hover:text-slate-600'
                      : 'text-amber-700 bg-amber-50 hover:bg-amber-100',
                  )}
                >
                  {imported[cls.class_id] ? 'Re-import' : 'Import CSV'}
                </button>

                <StudentImportDialog
                  open={!!importOpen[cls.class_id]}
                  onOpenChange={open => setImportOpen(cls.class_id, open)}
                  classId={cls.class_id}
                  onImportSuccess={() => onImportSuccess(cls.class_id)}
                />
              </div>
            ))}
          </div>
          {totalImported > 0 && (
            <p className="text-xs text-slate-400 pt-1">
              {totalImported} of {createdClasses.length} classes have students.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
          <Users className="h-5 w-5 text-slate-400 shrink-0" />
          <p className="text-sm text-slate-500">
            You can add students and classes from your dashboard after setup.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          size="lg"
          className="flex-1"
          disabled={isPending}
        >
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
            : totalImported > 0
            ? 'Go to Dashboard'
            : 'Skip, go to Dashboard'}
          {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}