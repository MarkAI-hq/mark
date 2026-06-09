'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getExamBuilderAssessments, generateMarkingGuideAction } from "@/lib/actions/exam-builder"
import { MarkingGuideViewer } from "@/components/exams/marking-guide-viewer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2, ArrowLeft, ChevronRight } from "lucide-react"
import { toast } from 'sonner'

export default function MarkingGuideStudio() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [guide, setGuide] = useState<any | null>(null)

  useEffect(() => {
    getExamBuilderAssessments().then(res => res.data && setAssessments(res.data))
  }, [])

  const handleGenerate = async () => {
    if (!selectedExamId) return
    setLoading(true)
    const exam = assessments.find(a => a.id === selectedExamId)
    
    const { data, error } = await generateMarkingGuideAction({
      exam_id: selectedExamId,
      curriculum_archetype: exam.curriculum_archetype,
      rubric_style: 'hybrid',
      model_answer_depth: 'detailed'
    })

    if (error) {
      toast.error(error.message)
    } else if (data) {
      setGuide(data.marking_guide)
      toast.success("Marking Guide Generated")
    }
    setLoading(false)
  }

  if (guide) return (
    <div className="bg-background min-h-screen">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b p-4 mb-6 shadow-sm no-print">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
           <Button variant="ghost" onClick={() => setGuide(null)} className="gap-2">
             <ArrowLeft size={16} /> Back to Studio
           </Button>
        </div>
      </div>
      <MarkingGuideViewer guide={guide} examId={selectedExamId} />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/dashboard/exam-builder" className="hover:text-foreground transition-colors">
          Examination Centre
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Marking Guide Studio</span>
      </nav>

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold">Marking Guide Studio</h1>
        <p className="text-muted-foreground">Select a generated assessment to create its marking criteria.</p>
      </div>

      <div className="bg-card border rounded-xl p-10 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Select Assessment</label>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger className="h-12 text-lg">
              <SelectValue placeholder="Choose an exam..." />
            </SelectTrigger>
            <SelectContent>
              {assessments.map(exam => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.subject} - {exam.grade_level} ({new Date(exam.createdAt).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full h-12 text-lg gap-2"
          disabled={!selectedExamId || loading}
          onClick={handleGenerate}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
          Generate Marking Guide
        </Button>
      </div>
    </div>
  )
}