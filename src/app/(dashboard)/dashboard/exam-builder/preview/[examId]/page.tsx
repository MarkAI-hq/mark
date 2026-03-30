import { getExamVariants } from "@/lib/actions/exam-builder"
import { ExamViewer } from "@/components/exams/exam-viewer"
import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{ examId: string }>
}

export default async function ExamPreviewPage({ params }: PageProps) {
  const resolvedParams = await params
  const examId = resolvedParams.examId

  const { data: variants, error } = await getExamVariants(examId)

  if (error || !variants || variants.length === 0) {
    return notFound()
  }

  return (
    <div className="bg-gray-50 min-h-screen print:bg-white">
      {/* 
          TOP NAV BAR 
          Added 'print:hidden' and 'shadow-none' for cleaner look
      */}
      <div className="p-4 bg-white border-b sticky top-0 z-20 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
              <h1 className="font-bold text-sm">
                Exam Previewer <span className="text-muted-foreground font-normal ml-2">| Reference: {examId.slice(0,8)}</span>
              </h1>
           </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="py-8 print:p-0">
        <ExamViewer variants={variants} />
      </main>
    </div>
  )
}