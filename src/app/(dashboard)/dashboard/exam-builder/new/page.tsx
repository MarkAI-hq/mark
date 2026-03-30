import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { ExamBuilderWizard } from "@/components/exams/exam-builder-wizard"

export default function NewExamPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          {/* ── Breadcrumb ───────────────────────────────────────────────── */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/dashboard/exam-builder" className="hover:text-foreground transition-colors">
              Examination Centre
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">New Exam</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight mt-4">Mark Exam Studio</h1>
          <p className="text-muted-foreground mt-2">
            Upload your content and let Mark·AI detect the curriculum and generate your new assessment.
          </p>
        </div>
        <ExamBuilderWizard />
      </div>
    </div>
  )
}