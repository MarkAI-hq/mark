'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Users, Star, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { enrollInExtra, type SchoolExtra, type ExtraEnrollment } from '@/lib/actions/extras'

interface Props {
  extras:      SchoolExtra[]
  enrollments: ExtraEnrollment[]
}

const CATEGORY_COLORS: Record<string, string> = {
  club:       'bg-blue-100 text-blue-700',
  sports:     'bg-green-100 text-green-700',
  arts:       'bg-purple-100 text-purple-700',
  academic:   'bg-amber-100 text-amber-700',
  other:      'bg-slate-100 text-slate-600',
}

export function CommunityClient({ extras, enrollments }: Props) {
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId]  = useState<string | null>(null)

  const enrolledIds = new Set(enrollments.map((e) => e.extra_id))

  function handleEnroll(extraId: string, isFree: boolean) {
    setLoadingId(extraId)
    startTransition(async () => {
      const res = await enrollInExtra(extraId)
      setLoadingId(null)
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url
      } else {
        toast.success('Enrolled successfully!')
        window.location.reload()
      }
    })
  }

  if (extras.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Community & Extras</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No extras available yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Your school hasn&apos;t added any clubs or activities yet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Community & Extras</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clubs, activities, and extras offered by your school.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {extras.map((extra) => {
          const isEnrolled = enrolledIds.has(extra.id)
          const isLoading  = loadingId === extra.id && pending

          return (
            <Card key={extra.id} className={isEnrolled ? 'border-gold/40 bg-gold/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{extra.name}</CardTitle>
                    {extra.description && (
                      <CardDescription className="mt-1 line-clamp-2">{extra.description}</CardDescription>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={CATEGORY_COLORS[extra.category] ?? CATEGORY_COLORS.other}
                  >
                    {extra.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {extra.is_free ? (
                      <Badge variant="outline" className="text-green-700 border-green-200">Free</Badge>
                    ) : (
                      <span className="text-sm font-semibold">${Number(extra.price_usd).toFixed(2)}</span>
                    )}
                    {isEnrolled && (
                      <Badge className="bg-gold/15 text-gold border-gold/30">
                        <Star className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  {!isEnrolled && (
                    <Button
                      size="sm"
                      variant={extra.is_free ? 'default' : 'outline'}
                      onClick={() => handleEnroll(extra.id, extra.is_free)}
                      disabled={isLoading}
                      className="gap-1.5"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : !extra.is_free ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : null}
                      {extra.is_free ? 'Join' : `Pay $${Number(extra.price_usd).toFixed(2)}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
