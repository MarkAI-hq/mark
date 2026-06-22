'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Printer, Edit3, Save, X, Sparkles, Loader2, FileText, FileCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ExamVariant } from '@/lib/types'
import { SourcesConsulted } from '@/components/common/sources-consulted'
import { 
  updateExamWorkflowState, 
  updateVariantContent, 
  generateImageAction 
} from '@/lib/actions/exam-builder'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function ExamViewer({ variants: initialVariants }: { variants: ExamVariant[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A')
  
  // Local state to track all modifications before saving
  const [localVariants, setLocalVariants] = useState(initialVariants)

  const currentVariantObj = localVariants.find(v => v.variant === activeVariant)
  const currentExam = currentVariantObj?.content
  
  if (!currentExam) return <div>Exam content not found.</div>
  const metadata = currentExam.metadata

  // --- Handlers ---

  const handleUpdate = (path: (string | number)[], value: any) => {
    const updated = JSON.parse(JSON.stringify(localVariants))
    const vIdx = updated.findIndex((v: any) => v.variant === activeVariant)
    let target = updated[vIdx].content
    
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]]
    }
    target[path[path.length - 1]] = value
    setLocalVariants(updated)
  }

  const handleSave = async () => {
    if (!currentVariantObj) return
    startTransition(async () => {
      const { error } = await updateVariantContent(currentVariantObj.id, currentVariantObj.content)
      if (error) {
        toast.error("Failed to save changes", { description: error.message })
      } else {
        toast.success("Exam content updated successfully")
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  const handleApprove = () => {
    if (!currentVariantObj) return
    startTransition(async () => {
      const { error } = await updateExamWorkflowState(currentVariantObj.examId, 'approved')
      if (error) {
        toast.error("Approval failed", { description: error.message })
      } else {
        toast.success("Examination Approved")
        // Update local state to reflect approval immediately
        const updated = localVariants.map(v => ({ ...v, workflowState: 'approved' }))
        setLocalVariants(updated)
        router.refresh()
      }
    })
  }

  const sanitize = (text: string) => {
    if (!text) return ""
    return text.replace(/^[a-z0-9]+-[a-z0-9-]+:\s*/i, '')
               .replace(/^q\d+-[a-z0-9-]+[\s.]*/i, '')
  }

  const isApproved = currentVariantObj?.workflowState === 'approved'

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 print:p-0">
      <style jsx global>{`
        @media print {
          @page { margin: 15mm; size: auto; }
          header, nav, aside, footer, button, .toolbar-area, .no-print { display: none !important; }
          .printable-paper { position: static !important; width: 100% !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; font-family: serif !important; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; font-size: 14px; }
          th { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      
      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-4 mb-6 rounded-lg border shadow-sm print:hidden toolbar-area">
        <div className="flex gap-2">
           {!isEditing ? (
             <>
               <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
               <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isApproved}>
                 <Edit3 className="w-4 h-4 mr-2"/> Edit Content
               </Button>
             </>
           ) : (
             <>
               <Button variant="default" size="sm" onClick={handleSave} disabled={isPending} className="bg-blue-600">
                 {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="w-4 h-4 mr-2"/>}
                 Save Changes
               </Button>
               <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setLocalVariants(initialVariants); }}>
                 <X className="w-4 h-4 mr-2"/> Cancel
               </Button>
             </>
           )}
        </div>
        
        <Tabs value={activeVariant} onValueChange={(v) => setActiveVariant(v as 'A' | 'B')}>
          <TabsList>
            <TabsTrigger value="A">Variant A</TabsTrigger>
            <TabsTrigger value="B">Variant B</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          size="sm" 
          className={isApproved ? "bg-gray-100 text-gray-500" : "bg-green-600 hover:bg-green-700"}
          onClick={handleApprove} 
          disabled={isPending || isEditing || isApproved}
        >
          {isApproved ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <FileCheck className="w-4 h-4 mr-2"/>}
          {isApproved ? 'Approved' : 'Approve Paper'}
        </Button>
      </div>

      {/* THE PAPER */}
      <div className="printable-paper bg-white border shadow-lg p-16 font-serif text-black min-h-screen">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-6 mb-12 border-b-4 border-double border-black pb-8">
          {isEditing ? (
            <Input 
              value={metadata.title} 
              className="text-2xl font-black text-center h-auto py-2 font-serif uppercase"
              onChange={(e) => handleUpdate(['metadata', 'title'], e.target.value)}
            />
          ) : (
            <h1 className="text-3xl font-black uppercase leading-tight">{metadata.title}</h1>
          )}

          <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-[13px] font-bold max-w-2xl mx-auto uppercase font-sans">
            {[
              { label: 'SUBJECT', key: 'subject' },
              { label: 'DURATION', key: 'duration_minutes', suffix: ' MINS' },
              { label: 'GRADE', key: 'grade_level' },
              { label: 'TOTAL MARKS', key: 'total_marks' }
            ].map((item) => (
              <div key={item.key} className="flex gap-2 border-b border-gray-100 py-1 items-center">
                <span className="w-24 shrink-0 text-left">{item.label}:</span>
                {isEditing ? (
                  <Input 
                    className="h-6 text-[13px] font-bold px-1" 
                    value={metadata[item.key]} 
                    onChange={(e) => handleUpdate(['metadata', item.key], e.target.value)} 
                  />
                ) : (
                  <span className="font-medium">{metadata[item.key]}{item.suffix || ''}</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 border-2 border-black text-left">
            <h4 className="font-bold text-[13px] mb-1 underline uppercase tracking-widest">Instructions:</h4>
            {isEditing ? (
              <Textarea 
                value={metadata.candidate_instructions} 
                className="font-serif italic text-[14px] min-h-[80px]" 
                onChange={(e) => handleUpdate(['metadata', 'candidate_instructions'], e.target.value)} 
              />
            ) : (
              <p className="text-[14px] leading-relaxed italic">{metadata.candidate_instructions}</p>
            )}
          </div>
        </div>

        {/* SECTIONS */}
        {currentExam.sections.map((section: any, sIdx: number) => (
          <div key={sIdx} className="mb-12 break-inside-avoid">
            <div className="flex justify-between items-center border-b-2 border-black mb-4">
              <div className="flex items-center gap-2 flex-1">
                <h2 className="font-bold text-xl uppercase py-1 shrink-0">SECTION {section.section_id}:</h2>
                {isEditing ? (
                  <Input 
                    value={section.title} 
                    className="font-bold text-xl uppercase h-9 border-none focus-visible:ring-1" 
                    onChange={(e) => handleUpdate(['sections', sIdx, 'title'], e.target.value)} 
                  />
                ) : (
                  <h2 className="font-bold text-xl uppercase py-1">{sanitize(section.title)}</h2>
                )}
              </div>
              <span className="font-bold text-md shrink-0">[{section.marks_allocated} MARKS]</span>
            </div>

            {/* SECTION STIMULUS (Reading Passage / Case Study) */}
            {(section.stimulus || isEditing) && (
              <div className="mb-8 p-6 border-x-4 border-black bg-gray-50 font-serif">
                {isEditing ? (
                  <div className="space-y-2 no-print">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <FileText size={10}/> Section Passage (Markdown/Tables Supported)
                    </label>
                    <Textarea 
                      value={section.stimulus || ""} 
                      className="bg-white text-sm font-serif min-h-[150px]" 
                      onChange={(e) => handleUpdate(['sections', sIdx, 'stimulus'], e.target.value)} 
                    />
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.stimulus}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-10">
              {section.questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="space-y-4 relative break-inside-avoid group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 flex gap-2">
                      <span className="font-bold text-lg shrink-0">{q.question_id}.</span>
                      {isEditing ? (
                        <Textarea 
                          value={q.question_text} 
                          className="mt-0 font-serif text-[16px] min-h-[40px]" 
                          onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'question_text'], e.target.value)} 
                        />
                      ) : (
                        <span className="text-[16px] leading-relaxed">{sanitize(q.question_text)}</span>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <span className="text-sm font-bold">(</span>
                          <input 
                            type="number" 
                            className="w-10 text-center font-bold border-b border-black outline-none bg-transparent" 
                            value={q.marks} 
                            onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'marks'], parseInt(e.target.value) || 0)} 
                          />
                          <span className="text-sm font-bold">)</span>
                        </>
                      ) : (
                        <span className="font-bold text-[15px]">({q.marks})</span>
                      )}
                    </div>
                  </div>

                  {/* QUESTION STIMULUS */}
                  {(q.stimulus || isEditing) && (
                    <div className="ml-8 p-4 border bg-slate-50/50 rounded-md">
                       {isEditing ? (
                         <Textarea 
                           value={q.stimulus || ""} 
                           placeholder="Question-specific stimulus (e.g. data table)..." 
                           className="text-xs min-h-[60px]" 
                           onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'stimulus'], e.target.value)} 
                         />
                       ) : (
                         <div className="prose prose-sm max-w-none">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.stimulus}</ReactMarkdown>
                         </div>
                       )}
                    </div>
                  )}

                  {/* IMAGE AREA */}
                  {(q.image_url || (isEditing && q.image_metadata?.requires_image)) && (
                    <div className="ml-8">
                       {q.image_url ? (
                         <div className="relative group/img inline-block">
                           <img src={q.image_url} className="max-h-[350px] rounded border-2 border-black" alt="Diagram" />
                           {isEditing && (
                             <Button 
                               variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" 
                               onClick={() => handleUpdate(['sections', sIdx, 'questions', qIdx, 'image_url'], null)}
                             >
                               <X size={14} />
                             </Button>
                           )}
                         </div>
                       ) : isEditing && (
                         <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-purple-50/30 no-print">
                            <Button 
                              variant="outline" size="sm" className="bg-white" 
                              onClick={async () => {
                                setIsEditing(false); // Close edit to prevent conflicts
                                const { data } = await generateImageAction(q.image_metadata.ai_generation_prompt);
                                if (data) handleUpdate(['sections', sIdx, 'questions', qIdx, 'image_url'], data.url);
                                setIsEditing(true);
                              }}
                            >
                              <Sparkles className="mr-2 h-4 w-4 text-purple-500"/> Generate Required Diagram
                            </Button>
                         </div>
                       )}
                    </div>
                  )}

                  {/* MCQ OPTIONS */}
                  {q.type === 'mcq' && (
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 ml-8">
                      {q.options?.map((opt: string, i: number) => (
                         <div key={i} className="text-[15px]">
                           {isEditing ? (
                             <Input 
                               value={opt} 
                               onChange={(e) => {
                                  const n = [...q.options];
                                  n[i] = e.target.value;
                                  handleUpdate(['sections', sIdx, 'questions', qIdx, 'options'], n);
                               }} 
                             />
                           ) : opt}
                         </div>
                      ))}
                    </div>
                  )}

                  {/* ANSWER LINES */}
                  {!['mcq'].includes(q.type) && !isEditing && (
                    <div className="space-y-6 ml-8 pt-2">
                       {Array.from({ length: q.answer_space_lines || 3 }).map((_, i) => (
                         <div key={i} className="border-b border-gray-300 h-4 w-full" />
                       ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-20 pt-4 border-t border-black text-center text-[10px] uppercase font-sans">
            {metadata.title} — Variant {activeVariant}
        </div>

        {currentExam?.sources_consulted?.length ? (
          <div className="mt-6 print:hidden">
            <SourcesConsulted
              citations={currentExam.sources_consulted}
              title="Generated from the official syllabus"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}