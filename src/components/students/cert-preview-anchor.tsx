'use client'

import Link from 'next/link'
import { Lock, Unlock, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  averageScore: number
  studentName:  string
  schoolName?:  string
  threshold?:   number
}

export function CertPreviewAnchor({
  averageScore,
  studentName,
  schoolName = 'Your School',
  threshold  = 60,
}: Props) {
  const progress    = Math.min(Math.round((averageScore / threshold) * 100), 100)
  const isEligible  = averageScore >= threshold
  const remaining   = Math.max(0, threshold - averageScore)

  return (
    <Card className={`relative overflow-hidden ${isEligible ? 'border-gold/40' : 'border-dashed'}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">

          {/* Blurred cert preview */}
          <div className="relative w-full sm:w-52 h-32 sm:h-auto shrink-0 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center overflow-hidden">
            {/* Mock cert content — blurred unless eligible */}
            <div className={`absolute inset-0 p-4 flex flex-col justify-center ${isEligible ? '' : 'blur-sm'}`}>
              <div className="text-white/30 text-[8px] font-semibold uppercase tracking-widest mb-1">Certificate of Achievement</div>
              <div className="text-white/60 text-xs font-bold truncate">{studentName}</div>
              <div className="text-white/40 text-[9px] mt-0.5">has successfully completed</div>
              <div className="text-amber-400/70 text-[10px] font-semibold mt-1 truncate">{schoolName}</div>
              <div className="text-white/20 text-[8px] mt-3 font-mono">MRK-CERT-████</div>
            </div>
            {/* Padlock overlay */}
            {!isEligible && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-1">
                  <Lock className="h-6 w-6 text-white" />
                  <span className="text-white text-xs font-semibold">{progress}%</span>
                </div>
              </div>
            )}
            {isEligible && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-gold text-gold-foreground gap-1 text-[10px]">
                  <Unlock className="h-2.5 w-2.5" /> Unlocked
                </Badge>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="p-4 flex-1 flex flex-col justify-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className={`h-4 w-4 ${isEligible ? 'text-gold' : 'text-muted-foreground'}`} />
                <span className="text-sm font-semibold">
                  {isEligible ? 'Certificate Ready!' : 'Progress to Certificate'}
                </span>
              </div>
              {isEligible ? (
                <p className="text-xs text-muted-foreground">
                  You&apos;ve hit {averageScore}% — above the {threshold}% passing threshold.
                  Your certificate is ready to unlock.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {averageScore}% average · {remaining}% more to reach the {threshold}% threshold.
                  Keep completing study plans.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Progress value={progress} className={`h-1.5 ${isEligible ? '[&>div]:bg-gold' : ''}`} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span className={isEligible ? 'text-gold font-semibold' : ''}>{threshold}% required</span>
              </div>
            </div>

            {isEligible ? (
              <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground w-fit gap-1.5">
                <Link href="/student/certificates">
                  <Award className="h-3.5 w-3.5" />
                  Unlock Certificate
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="w-fit text-xs">
                <Link href="/student/study-plans">Continue Study Plans</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
