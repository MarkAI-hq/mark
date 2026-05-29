// src/components/exams/generation-config-form.tsx
'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ExamDetectionResult,
  CurriculumArchetype,
  QuestionType,
  ExamLanguage,
  ExamSource,
  type GenerateExamPayload,
} from '@/lib/types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Settings2,
  AlertTriangle,
} from 'lucide-react'

import { useExamGeneration } from '@/hooks/use-exam-generation'
import { GenerationProgress } from '@/components/exams/generation-progress'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const sectionConfigSchema = z.object({
  title:                z.string().min(1, 'Section title is required'),
  question_type:        z.nativeEnum(QuestionType),
  num_questions:        z.number().int().min(1, 'At least 1 question').max(50),
  marks_per_question:   z.number().int().min(1, 'At least 1 mark').max(50),
  section_instructions: z.string().optional(),
})

const genSchema = z.object({
  subject:              z.string().min(1, 'Subject is required'),
  grade_level:          z.string().min(1, 'Grade level is required'),
  curriculum_archetype: z.nativeEnum(CurriculumArchetype),
  total_marks:          z.number().min(10).max(300),
  duration_minutes:     z.number().min(20).max(240),
  copies:               z.literal(1).or(z.literal(2)),
  topic:                z.string().optional(),
  assessment_period:    z.string().optional(),
  special_instructions: z.string().optional(),
  section_structure:    z.array(sectionConfigSchema).optional(),
})

type GenFormValues = z.infer<typeof genSchema>

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.MCQ]:          'Multiple Choice (MCQ)',
  [QuestionType.SHORT_ANSWER]: 'Short Answer',
  [QuestionType.ESSAY]:        'Essay',
  [QuestionType.TRUE_FALSE]:   'True / False',
  [QuestionType.FILL_BLANK]:   'Fill in the Blank',
  [QuestionType.MATCHING]:     'Matching',
  [QuestionType.STRUCTURED]:   'Structured',
  [QuestionType.CASE_STUDY]:   'Case Study',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GenerationConfigForm({
  detection: apiResponse,
  sourceContent,
}: {
  detection: any
  sourceContent: string
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ── Async generation hook — owns redirect on completion ──────────────────
  const { generate, state, progress, error: genError, reset } = useExamGeneration()

  const aiResult = apiResponse?.detection

  const form = useForm<GenFormValues>({
    resolver: zodResolver(genSchema),
    defaultValues: {
      subject:              aiResult?.subject               || '',
      grade_level:          aiResult?.grade_level           || '',
      curriculum_archetype: aiResult?.recommended_archetype || CurriculumArchetype.EAST_AFRICA,
      total_marks:          aiResult?.recommended_config?.total_marks      || 100,
      duration_minutes:     aiResult?.recommended_config?.duration_minutes || 90,
      copies:               2 as const,
      topic:                '',
      assessment_period:    '',
      special_instructions: '',
      section_structure:    [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'section_structure',
  })

  const watchedSections   = form.watch('section_structure') ?? []
  const watchedTotalMarks = form.watch('total_marks')
  const sectionMarksSum   = watchedSections.reduce(
    (sum, s) => sum + (s.num_questions || 0) * (s.marks_per_question || 0),
    0,
  )
  const marksMismatch = showAdvanced && fields.length > 0 && sectionMarksSum !== watchedTotalMarks

  function addSection() {
    append({
      title:                `Section ${String.fromCharCode(65 + fields.length)}`,
      question_type:        QuestionType.SHORT_ANSWER,
      num_questions:        5,
      marks_per_question:   2,
      section_instructions: '',
    })
  }

  // ── Submit — enqueues job, hook handles polling + redirect ────────────────
  async function onSubmit(values: GenFormValues) {
    const payload: GenerateExamPayload = {
      ...values,
      source:             ExamSource.AUTO,
      source_content:     sourceContent,
      language:           ExamLanguage.EN,
      question_types:     aiResult?.recommended_config?.question_types || [
        QuestionType.MCQ,
        QuestionType.SHORT_ANSWER,
        QuestionType.ESSAY,
      ],
      bloom_distribution:  true,
      section_structure:   (values.section_structure?.length ?? 0) > 0
        ? values.section_structure
        : undefined,
      topic:                values.topic               || undefined,
      assessment_period:    values.assessment_period   || undefined,
      special_instructions: values.special_instructions || undefined,
    }

    // generate() enqueues the job and starts polling.
    // On completion useExamGeneration redirects to /dashboard/exam-builder/preview/:exam_id
    // No manual router.push or toast needed here.
    await generate(payload)
  }

  // ── While generating, show progress screen instead of form ───────────────
  if (state !== 'idle') {
    return (
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <GenerationProgress
          state={state}
          progress={progress}
          error={genError}
          onRetry={reset}
        />
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      {/* AI Analysis Banner */}
      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <h4 className="font-bold text-blue-800 flex items-center gap-2">
          <Sparkles size={16} />
          Mirror Intelligence Analysis ({Math.round((aiResult?.confidence || 0) * 100)}% Confidence)
        </h4>
        <p className="text-sm text-blue-700 mt-1">
          {aiResult?.reasoning || 'Content analyzed successfully. Review the configuration below.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl><Input placeholder="e.g. Social Studies" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level</FormLabel>
                  <FormControl><Input placeholder="e.g. P.4 / Grade 10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="e.g. Location of Our District" {...field} /></FormControl>
                  <FormDescription className="text-xs">If blank, Mirror Intelligence infers topics from the uploaded content.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assessment_period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Period <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="e.g. End of Term 1" {...field} /></FormControl>
                  <FormDescription className="text-xs">Printed on the exam paper header.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="curriculum_archetype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assessment Framework (Curriculum)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select framework" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CurriculumArchetype).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="total_marks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Marks</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="copies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Variant Strategy</FormLabel>
                <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Single Paper (Variant A Only)</SelectItem>
                    <SelectItem value="2">Two Variants (A &amp; B — Shuffled Questions)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="special_instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='e.g. "Include a map-reading question in Section B"'
                    className="resize-none h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">Free-text guidance passed directly to Mirror Intelligence when building the paper.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ── Advanced: Section Structure ────────────────────────────────── */}
          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            >
              <span className="flex items-center gap-2">
                <Settings2 size={15} className="text-gray-500" />
                Advanced: Define Section Structure
                <span className="text-xs font-normal text-muted-foreground">— leave collapsed to let Mirror Intelligence decide</span>
              </span>
              {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t bg-white">
                <p className="text-xs text-muted-foreground">
                  Define each section below. The AI will follow this layout exactly.
                </p>

                {marksMismatch && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>
                      Section marks sum to <strong>{sectionMarksSum}</strong> but Total Marks is <strong>{watchedTotalMarks}</strong>. The AI will honour the sections and adjust the total accordingly.
                    </span>
                  </div>
                )}

                {fields.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4 border border-dashed rounded-lg">
                    No sections defined — AI will design the structure automatically.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg border">
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`section_structure.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Section Title</FormLabel>
                                <FormControl><Input placeholder="e.g. Section A" className="h-8 text-sm" {...field} /></FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`section_structure.${index}.question_type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Question Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(QuestionType).map((qt) => (
                                      <SelectItem key={qt} value={qt} className="text-sm">{QUESTION_TYPE_LABELS[qt]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`section_structure.${index}.num_questions`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Questions</FormLabel>
                                <FormControl>
                                  <Input type="number" className="h-8 text-sm" min={1} max={50} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`section_structure.${index}.marks_per_question`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Marks Each</FormLabel>
                                <FormControl>
                                  <Input type="number" className="h-8 text-sm" min={1} max={50} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-1 pt-6 flex justify-center">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="col-span-12">
                          <FormField
                            control={form.control}
                            name={`section_structure.${index}.section_instructions`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Section Instructions <span className="font-normal">(optional)</span></FormLabel>
                                <FormControl>
                                  <Input placeholder='e.g. "Answer any 3 of the following."' className="h-8 text-sm" {...field} />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                        {watchedSections[index]?.num_questions > 0 && watchedSections[index]?.marks_per_question > 0 && (
                          <div className="col-span-12">
                            <p className="text-xs text-muted-foreground">
                              → {watchedSections[index].num_questions} × {watchedSections[index].marks_per_question} = <strong>{watchedSections[index].num_questions * watchedSections[index].marks_per_question} marks</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={addSection} className="h-8 text-sm gap-1.5">
                    <Plus size={13} />
                    Add Section
                  </Button>
                  {fields.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Total defined: <strong className={marksMismatch ? 'text-amber-600' : 'text-gray-800'}>{sectionMarksSum} marks</strong>
                      {' '}across <strong>{fields.length}</strong> section{fields.length !== 1 ? 's' : ''},{' '}
                      <strong>{watchedSections.reduce((sum, s) => sum + (s.num_questions || 0), 0)}</strong> questions
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Submit ─────────────────────────────────────────────────────── */}
          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Queuing your exam...
              </>
            ) : (
              'Generate Examination'
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}