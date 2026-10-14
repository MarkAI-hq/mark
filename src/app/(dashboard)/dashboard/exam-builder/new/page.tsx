import Link from "next/link"
import { BookOpen, ChevronRight, FileUp } from "lucide-react"
import { ExamBuilderWizard } from "@/components/exams/exam-builder-wizard"
import { ExamPathSelector } from "@/components/exams/exam-path-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewExamPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/dashboard/exam-builder" className="hover:text-foreground transition-colors">
              Examination Centre
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">New Exam</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight mt-4">Mirror Exam Studio</h1>
          <p className="text-muted-foreground mt-2">
            Generate straight from a curriculum you already teach — no upload needed — or build one from your own notes or past papers.
          </p>
        </div>

        <Tabs defaultValue="curriculum">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="curriculum" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              From Curriculum
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <FileUp className="h-3.5 w-3.5" />
              Upload Document
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="mt-6">
            <ExamPathSelector autoStart />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <ExamBuilderWizard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
