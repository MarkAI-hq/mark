'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, AlertCircle, Info, Hash, Edit3, Save, X, Loader2, CheckCircle2, FileCheck 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { updateMarkingGuideState } from '@/lib/actions/exam-builder' // FIXED IMPORT
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Helper to safely convert AI outputs to strings
const safeString = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  if (Array.isArray(val)) return val.map(safeString).join('\n');
  return String(val);
};

export function MarkingGuideViewer({ guide: initialGuide, examId }: { guide: any, examId?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [localGuide, setLocalGuide] = useState(initialGuide)

  // --- DATA EXTRACTION ---
  const metadata = localGuide?.metadata || {}
  const sections = Array.isArray(localGuide?.sections) ? localGuide.sections : []
  const markSummary = localGuide?.mark_summary || { by_section: {} }

  // --- AUTO-CALCULATORS ---
  const getQuestionMarks = (q: any) => {
    let m = Number(q.marks);
    if (m > 0) return m;
    if (Array.isArray(q.mark_allocation)) {
       return q.mark_allocation.reduce((sum: number, pt: any) => sum + (Number(pt.marks) || 0), 0);
    }
    return 0;
  }

  const getSectionMarks = (sec: any) => {
    let sm = Number(markSummary.by_section?.[sec.section_id]) || Number(sec.marks_allocated);
    if (sm > 0) return sm;
    if (Array.isArray(sec.questions)) {
       return sec.questions.reduce((sum: number, q: any) => sum + getQuestionMarks(q), 0);
    }
    return 0;
  }

  const getTotalMarks = () => {
    let tm = Number(metadata.total_marks);
    if (tm > 0) return tm;
    return sections.reduce((sum: number, sec: any) => sum + getSectionMarks(sec), 0);
  }

  const targetExamId = examId || localGuide?.exam_id || metadata?.exam_id;

  // --- HANDLERS ---
  const handleUpdate = (path: (string | number)[], value: any) => {
    const updated = JSON.parse(JSON.stringify(localGuide))
    let target = updated
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) target[path[i]] = {}
      target = target[path[i]]
    }
    target[path[path.length - 1]] = value
    setLocalGuide(updated)
  }

  const handleSave = async () => {
    // In a real app, you would call an update action here.
    // For now, we simulate success to exit edit mode.
    toast.success("Changes saved locally (Implement persistence if needed)")
    setIsEditing(false)
  }

  const handleApprove = () => {
    if (!targetExamId) return toast.error("Exam ID missing. Cannot approve.");
    
    startTransition(async () => {
      // FIXED: Calling the correct action for Marking Guides
      const { error } = await updateMarkingGuideState(targetExamId, 'approved')
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Marking Guide Approved")
        // Update local state immediately
        setLocalGuide({ ...localGuide, workflow_state: 'approved' })
        router.refresh()
      }
    })
  }

  const sanitize = (text: any) => {
    const str = safeString(text);
    return str.replace(/^[a-z0-9]+-[a-z0-9-]+:\s*/i, '').replace(/^q\d+-[a-z0-9-]+[\s.]*/i, '');
  }

  const isApproved = localGuide?.workflow_state === 'approved'

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <style jsx global>{`
        /* Markdown Table Styling */
        .prose table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.875rem; }
        .prose th, .prose td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        .prose th { background-color: #f8fafc; font-weight: 600; }
      `}</style>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-4 z-30 no-print">
        <div className="flex gap-2">
           {!isEditing ? (
             <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isApproved}>
               <Edit3 className="w-4 h-4 mr-2"/> Edit Guide
             </Button>
           ) : (
             <>
               <Button variant="default" size="sm" onClick={handleSave} className="bg-blue-600">
                 <Save className="w-4 h-4 mr-2"/> Save Changes
               </Button>
               <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setLocalGuide(initialGuide); }}>
                 <X className="w-4 h-4 mr-2"/> Cancel
               </Button>
             </>
           )}
        </div>
        <Button 
          size="sm" 
          className={isApproved ? "bg-gray-100 text-gray-500" : "bg-green-600 hover:bg-green-700"}
          onClick={handleApprove} 
          disabled={isEditing || isApproved || isPending}
        >
          {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : isApproved ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <FileCheck className="w-4 h-4 mr-2"/>}
          {isApproved ? 'Approved' : 'Approve Guide'}
        </Button>
      </div>

      {/* HEADER */}
      <div className="bg-slate-900 text-white p-8 rounded-t-xl shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-4">
            <Badge className="bg-blue-500 uppercase">Official Marking Guide</Badge>
            {isEditing ? (
              <Input 
                value={safeString(metadata.exam_title || metadata.title)} 
                className="bg-slate-800 border-slate-700 text-2xl font-bold h-auto py-2"
                onChange={(e) => handleUpdate(['metadata', 'exam_title'], e.target.value)}
              />
            ) : (
              <h1 className="text-3xl font-bold whitespace-pre-wrap">{safeString(metadata.exam_title || metadata.title || "Untitled Assessment")}</h1>
            )}
            <div className="flex gap-4 text-slate-400 text-sm">
               <span>{safeString(metadata.subject) || "No Subject"}</span>
               <span>•</span>
               <span>{safeString(metadata.grade_level) || "No Grade"}</span>
            </div>
          </div>
          <div className="text-right ml-8">
             <p className="text-xs text-slate-400 uppercase tracking-widest">Total Marks</p>
             <p className="text-4xl font-black">{getTotalMarks()}</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-700">
           <p className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-2">
             <Info size={14} /> General Instructions to Markers
           </p>
           {isEditing ? (
             <Textarea 
               value={safeString(metadata.general_instructions_to_markers)} 
               className="bg-slate-800 border-slate-700 text-slate-300 text-sm min-h-[80px]"
               onChange={(e) => handleUpdate(['metadata', 'general_instructions_to_markers'], e.target.value)}
             />
           ) : (
             <p className="text-sm text-slate-400 italic leading-relaxed whitespace-pre-wrap">
               {safeString(metadata.general_instructions_to_markers) || "Standard marking rules apply."}
             </p>
           )}
        </div>
      </div>

      {/* SECTIONS */}
      {sections.length > 0 ? sections.map((section: any, sIdx: number) => (
        <div key={sIdx} className="space-y-6">
          <div className="bg-slate-100 px-4 py-2 rounded-md border flex justify-between items-center">
             <div className="flex items-center gap-2">
               <h2 className="font-bold text-slate-700 uppercase text-sm">Section {safeString(section.section_id) || "?"}</h2>
               {isEditing && (
                 <Input 
                   value={safeString(section.title)} 
                   className="h-7 text-xs font-bold uppercase w-64" 
                   onChange={(e) => handleUpdate(['sections', sIdx, 'title'], e.target.value)}
                 />
               )}
             </div>
             <span className="text-xs font-semibold text-slate-500 uppercase">
               Section Marks: {getSectionMarks(section)}
             </span>
          </div>

          {(Array.isArray(section.questions) ? section.questions : []).map((q: any, qIdx: number) => (
            <div key={qIdx} className="bg-white border rounded-lg shadow-sm overflow-hidden border-l-4 border-l-blue-500">
              <div className="p-4 bg-blue-50/50 border-b flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-bold text-blue-600 uppercase">Question {safeString(q.question_id)}</span>
                  {isEditing ? (
                    <Textarea 
                      value={safeString(q.question_text)} 
                      className="text-sm font-medium bg-white"
                      onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'question_text'], e.target.value)}
                    />
                  ) : (
                    // FIXED: Added ReactMarkdown to render tables in question text
                    <div className="text-sm font-medium prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{sanitize(q.question_text)}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0">{getQuestionMarks(q)} Marks</Badge>
              </div>

              <div className="p-6 space-y-6">
                {/* CORRECT ANSWER (MCQ) */}
                {q.type === 'mcq' && q.correct_answer && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold uppercase text-slate-500">Correct Option:</span>
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold border-2 border-green-500">
                      {safeString(q.correct_answer)}
                    </div>
                  </div>
                )}

                {/* MODEL ANSWER */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
                    <CheckCircle size={12} /> Model Answer
                  </span>
                  {isEditing ? (
                    <Textarea 
                      value={safeString(q.model_answer)} 
                      className="text-sm bg-green-50/30 border-green-100 min-h-[80px]"
                      onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'model_answer'], e.target.value)}
                    />
                  ) : (
                    // FIXED: Added ReactMarkdown to render tables in model answers
                    <div className="p-4 bg-green-50 border border-green-100 rounded text-sm leading-relaxed text-slate-700 prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {safeString(q.model_answer) || "No model answer provided."}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* MARK ALLOCATION */}
                <div className="space-y-3">
                   <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
                     <Hash size={12} /> Mark Allocation
                   </span>
                   <div className="space-y-2">
                     {Array.isArray(q.mark_allocation) && q.mark_allocation.length > 0 ? q.mark_allocation.map((pt: any, pIdx: number) => (
                       <div key={pIdx} className="flex justify-between items-start gap-4 p-3 bg-slate-50 rounded border text-sm">
                          {isEditing ? (
                            <Input 
                              value={safeString(pt.point)} 
                              className="flex-1 h-8 bg-white"
                              onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'mark_allocation', pIdx, 'point'], e.target.value)}
                            />
                          ) : (
                            <span className="flex-1 whitespace-pre-wrap">• {safeString(pt.point)}</span>
                          )}
                          <Badge variant="secondary" className="bg-white border">+{safeString(pt.marks) || 0}</Badge>
                       </div>
                     )) : (
                       <p className="text-xs text-slate-400 italic">No granular mark allocation provided.</p>
                     )}
                   </div>
                </div>

                {/* EXAMINER NOTES */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Examiner Notes & Guidance</span>
                  </div>
                  {isEditing ? (
                    <Textarea 
                      value={safeString(q.examiner_notes)} 
                      className="text-xs bg-white border-amber-200"
                      onChange={(e) => handleUpdate(['sections', sIdx, 'questions', qIdx, 'examiner_notes'], e.target.value)}
                    />
                  ) : (
                    <p className="text-xs text-amber-800 leading-relaxed italic whitespace-pre-wrap">
                      {safeString(q.examiner_notes) || "No specific examiner notes provided."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )) : (
        <div className="p-20 text-center border-2 border-dashed rounded-xl">
          <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-500">No Sections Found</h3>
          <p className="text-sm text-slate-400">The AI failed to generate structured sections for this guide.</p>
        </div>
      )}
    </div>
  )
}