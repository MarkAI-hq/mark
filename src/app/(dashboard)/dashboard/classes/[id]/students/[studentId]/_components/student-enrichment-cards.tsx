'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, CalendarCheck2, Layers, BookOpen, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudentPrediction } from '@/lib/actions/prediction'

interface StudentEnrichmentCardsProps {
  attendanceRate:       number | null
  studyPlanCompletion:  number | null  // 0–100
  curriculumId:         string | null
  studentId:            string
  bufferCount:          number
  lessonsPerDay:        number | null
}

function PredictionCard({ studentId, curriculumId }: { studentId: string; curriculumId: string | null }) {
  const [grade,   setGrade]   = useState<string | null>(null)
  const [traj,    setTraj]    = useState<'improving' | 'steady' | 'declining' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!curriculumId) { setLoading(false); return }
    getStudentPrediction(studentId, curriculumId).then((res) => {
      if (res.data) {
        setGrade(res.data.predicted_grade)
        setTraj(res.data.trajectory)
      }
      setLoading(false)
    })
  }, [studentId, curriculumId])

  const TrendIcon = traj === 'improving'
    ? TrendingUp
    : traj === 'declining'
      ? TrendingDown
      : Minus

  const trendColor = traj === 'improving'
    ? 'text-green-500'
    : traj === 'declining'
      ? 'text-red-500'
      : 'text-amber-500'

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Exam Prediction</p>
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>
        {loading ? (
          <div className="h-7 w-16 bg-muted rounded animate-pulse mt-1" />
        ) : grade ? (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold">{grade}</p>
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          </div>
        ) : (
          <Badge variant="secondary" className="mt-1 text-xs">Pending</Badge>
        )}
      </CardContent>
    </Card>
  )
}

export function StudentEnrichmentCards({
  attendanceRate, studyPlanCompletion, curriculumId, studentId, bufferCount, lessonsPerDay,
}: StudentEnrichmentCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {/* Attendance Rate */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendance</p>
            <CalendarCheck2 className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          {attendanceRate != null ? (
            <>
              <p className="text-2xl font-bold mt-1">{attendanceRate}%</p>
              <Badge
                className={`mt-1 text-xs ${
                  attendanceRate >= 80
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : attendanceRate >= 60
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {attendanceRate >= 80 ? 'Good' : attendanceRate >= 60 ? 'At Risk' : 'Critical'}
              </Badge>
            </>
          ) : (
            <Badge variant="secondary" className="mt-2 text-xs">No data</Badge>
          )}
        </CardContent>
      </Card>

      {/* Study Plan Completion */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan Completion</p>
            <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          {studyPlanCompletion != null ? (
            <>
              <p className="text-2xl font-bold mt-1">{studyPlanCompletion}%</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${studyPlanCompletion >= 70 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  style={{ width: `${studyPlanCompletion}%` }}
                />
              </div>
            </>
          ) : (
            <Badge variant="secondary" className="mt-2 text-xs">No plans yet</Badge>
          )}
        </CardContent>
      </Card>

      {/* Lesson Buffer */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lesson Buffer</p>
            <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold mt-1">{bufferCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">days queued</p>
        </CardContent>
      </Card>

      {/* Daily Pace */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Daily Pace</p>
            <Zap className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
          {lessonsPerDay != null ? (
            <>
              <p className="text-2xl font-bold mt-1">{lessonsPerDay}</p>
              <p className="text-xs text-muted-foreground mt-0.5">lesson{lessonsPerDay !== 1 ? 's' : ''}/day</p>
            </>
          ) : (
            <Badge variant="secondary" className="mt-2 text-xs">Default (1/day)</Badge>
          )}
        </CardContent>
      </Card>

      {/* Prediction */}
      <PredictionCard studentId={studentId} curriculumId={curriculumId} />
    </div>
  )
}
