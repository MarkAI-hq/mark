"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { TAssessment } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function AssessmentQuestionCard({ questions }: { questions: TAssessment[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Ensure there are 1-10 questions
  const validItems = questions.slice(0, Math.min(10, Math.max(questions.length, 1)))

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col items-center text-center mb-8">
        <p className="text-muted-foreground mt-2">{validItems.length} questions to explore</p>
      </div>

      <div className="grid gap-6 mx-auto">
        {validItems.map((item, index) => (
          <motion.div
            key={item.number}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="w-full"
          >
            <Card
              className={cn(
                "transition-all duration-300 cursor-pointer border-l-4",
                activeIndex === index ? "border-l-primary shadow-lg" : "border-l-transparent hover:border-l-primary/50",
              )}
              onClick={() => setActiveIndex(index === activeIndex ? null : index)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{item.number}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-lg font-medium leading-relaxed">{item.question}</p>

                    {activeIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 text-sm text-muted-foreground"
                      >
                        <p>Click to minimize this question.</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}