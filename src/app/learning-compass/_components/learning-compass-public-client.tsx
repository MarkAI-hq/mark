'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, Target, Users, BookOpen, Lightbulb, ArrowRight, CheckCircle2, Mail, Download } from 'lucide-react'
import {
  submitPublicCompass,
  updateCompassFeedback,
  resendCompassEmail,
  getAvailableCountries,
  getLevelsForSchool,
  getSubjectsForSchool,
  getSubjectPreview,
  startSubjectPreviewDiagnostic,
  submitSubjectPreviewDiagnostic,
  type PublicCompassStructure,
  type PublicCompassProfile,
  type PublicCompassTool,
  type AvailableCountry,
  type CatalogSubjectOption,
  type SubjectPreview,
  type SubjectPreviewDiagnosticStart,
  type SubjectPreviewDiagnosticResult,
} from '@/lib/actions/public-compass'
import { COUNTRIES } from '@/lib/constants/countries'
import { titleCase } from '@/lib/utils/text'

type Stage =
  | 'intro'
  | 'quiz'
  | 'contact'
  | 'results'
  | 'feedback'
  | 'picker'
  | 'preview'
  | 'diagnostic'
  | 'diagnostic-results'
  | 'cta'

function profileIcon(name: string) {
  if (name === 'The Careful Builder') return <BookOpen className="w-6 h-6" />
  if (name === 'The Energetic Explorer') return <Target className="w-6 h-6" />
  if (name === 'The Confident Navigator') return <Users className="w-6 h-6" />
  if (name === 'The Thoughtful Planner') return <Lightbulb className="w-6 h-6" />
  return <Brain className="w-6 h-6" />
}

export function LearningCompassPublicClient({ structure }: { structure: PublicCompassStructure }) {
  const { assessment } = structure
  const sections = useMemo(() => assessment.sections, [assessment.sections])

  const [stage, setStage] = useState<Stage>('intro')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd'>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [leadId, setLeadId] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicCompassProfile | null>(null)
  const [tools, setTools] = useState<PublicCompassTool[]>([])
  const [mentalEnergyScore, setMentalEnergyScore] = useState(0)
  const [learningStrategyScore, setLearningStrategyScore] = useState(0)
  const [emailedTo, setEmailedTo] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [wantsContact, setWantsContact] = useState<boolean | null>(null)
  const [contactChannel, setContactChannel] = useState('')
  const [accuracyRating, setAccuracyRating] = useState<'accurate' | 'somewhat' | 'not_really' | null>(null)
  const [biggestChallenge, setBiggestChallenge] = useState('')

  // ── Curriculum-grounded picker: country → level → subject ─────────────────
  const [availableCountries, setAvailableCountries] = useState<AvailableCountry[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null)
  const [levels, setLevels] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [subjectOptions, setSubjectOptions] = useState<SubjectsResult | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<CatalogSubjectOption | null>(null)

  const [preview, setPreview] = useState<SubjectPreview | null>(null)
  const [diagnostic, setDiagnostic] = useState<SubjectPreviewDiagnosticStart | null>(null)
  const [diagAnswers, setDiagAnswers] = useState<number[]>([])
  const [diagResult, setDiagResult] = useState<SubjectPreviewDiagnosticResult | null>(null)

  const selectedCountry = availableCountries.find((c) => c.country_code === selectedCountryCode) ?? null

  function handleAnswer(questionId: string, value: 'a' | 'b' | 'c' | 'd') {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmitContact() {
    setError(null)
    if (!fullName.trim()) {
      setError('Enter your name to see your results.')
      return
    }
    if (!email.trim() && !phone.trim()) {
      setError('Enter an email or phone number so we can share your results.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error: err } = await submitPublicCompass({
        answers,
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
      })
      if (err || !data) {
        setError(err?.message ?? 'Could not submit — please try again.')
        return
      }
      setLeadId(data.lead_id)
      setProfile(data.profile)
      setTools(data.tools)
      setMentalEnergyScore(data.mental_energy_score)
      setLearningStrategyScore(data.learning_strategy_score)
      if (email.trim()) setEmailedTo(email.trim())
      setStage('results')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendEmail() {
    if (!leadId) return
    setResendStatus('sending')
    const { error: err } = await resendCompassEmail(leadId)
    setResendStatus(err ? 'idle' : 'sent')
    if (err) setError(err.message)
  }

  function handleDownloadResults() {
    if (!profile) return
    const lines = [
      `Learning Compass Results — ${fullName || 'You'}`,
      '',
      `Profile: ${profile.profile_name}`,
      profile.description ?? '',
      profile.focus ? `Focus: ${profile.focus}` : '',
      '',
      `Mental Energy Score: ${mentalEnergyScore}`,
      `Learning Strategy Score: ${learningStrategyScore}`,
      '',
      'Your toolkit:',
      ...tools.map((t) => `- ${t.name}: ${t.description}${t.how_to ? ` (How to: ${t.how_to})` : ''}`),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-compass-${(fullName || 'results').replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  }

  async function handleSubmitFeedback() {
    setError(null)
    if (!accuracyRating) {
      setError('Let us know how accurate your profile felt.')
      return
    }
    if (leadId) {
      await updateCompassFeedback(leadId, {
        wants_contact: !!wantsContact,
        contact_channel: wantsContact ? contactChannel || undefined : undefined,
        experience_feedback: {
          accuracy_rating: accuracyRating,
          biggest_challenge: biggestChallenge.trim() || undefined,
        },
      })
    }
    if (wantsContact) {
      setStage('picker')
      loadCountries()
    } else {
      setStage('cta')
    }
  }

  async function loadCountries() {
    setCountriesLoading(true)
    try {
      const { data } = await getAvailableCountries()
      setAvailableCountries(data ?? [])
    } finally {
      setCountriesLoading(false)
    }
  }

  async function handleSelectCountry(code: string) {
    setError(null)
    setSelectedCountryCode(code)
    setSelectedLevel(null)
    setSelectedSubject(null)
    setLevels([])
    setSubjectOptions(null)
    const country = availableCountries.find((c) => c.country_code === code)
    if (!country) return
    setSubmitting(true)
    try {
      const { data, error: err } = await getLevelsForSchool(country.school_code)
      if (err || !data) {
        setError(err?.message ?? 'Could not load class levels.')
        return
      }
      setLevels(data)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSelectLevel(level: string) {
    setError(null)
    setSelectedLevel(level)
    setSelectedSubject(null)
    if (!selectedCountry) return
    setSubmitting(true)
    try {
      const { data, error: err } = await getSubjectsForSchool(selectedCountry.school_code, level)
      if (err || !data) {
        setError(err?.message ?? 'Could not load subjects.')
        return
      }
      setSubjectOptions(data)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSelectSubject(subj: CatalogSubjectOption) {
    if (!selectedCountry) return
    setError(null)
    setSelectedSubject(subj)
    setSubmitting(true)
    try {
      const { data, error: err } = await getSubjectPreview({
        subject: subj.label,
        school_code: selectedCountry.school_code,
      })
      if (err || !data) {
        setError(err?.message ?? "That subject isn't available to preview yet.")
        return
      }
      setPreview(data)
      setStage('preview')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStartDiagnostic() {
    if (!selectedSubject || !selectedCountry) return
    setError(null)
    setSubmitting(true)
    try {
      const { data, error: err } = await startSubjectPreviewDiagnostic({
        subject: selectedSubject.label,
        school_code: selectedCountry.school_code,
      })
      if (err || !data) {
        setError(err?.message ?? 'Could not start the preview quiz.')
        return
      }
      setDiagnostic(data)
      setDiagAnswers(new Array(data.questions.length).fill(-1))
      setStage('diagnostic')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitDiagnostic() {
    if (!diagnostic || !leadId) return
    setError(null)
    setSubmitting(true)
    try {
      const { data, error: err } = await submitSubjectPreviewDiagnostic({
        lead_id: leadId,
        assessment_id: diagnostic.assessment_id,
        answers: diagAnswers,
      })
      if (err || !data) {
        setError(err?.message ?? 'Could not grade the preview quiz.')
        return
      }
      setDiagResult(data)
      setStage('diagnostic-results')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {stage === 'intro' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gold">{assessment.title}</CardTitle>
              <CardDescription className="text-lg">
                A free, two-minute look at how you learn best — no sign-up required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gold/5 border border-gold/20 p-6 rounded-xl">
                <p className="text-muted-foreground">
                  This isn&apos;t a test — there are no right or wrong answers. Answer honestly and
                  you&apos;ll get a personal learning profile and a toolkit of techniques matched to it.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {sections.map((s) => (
                  <Card key={s.id} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button className="w-full" size="lg" variant="gold" onClick={() => setStage('quiz')}>
                Begin — it&apos;s free
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'quiz' && sections[sectionIndex] && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Section {sectionIndex + 1} of {sections.length}</Badge>
              </div>
              <Progress value={(sectionIndex / sections.length) * 100} className="mb-4" />
              <CardTitle>{sections[sectionIndex].title}</CardTitle>
              <CardDescription>{sections[sectionIndex].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {sections[sectionIndex].questions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <p className="font-medium">{q.text}</p>
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(v) => handleAnswer(q.id, v as 'a' | 'b' | 'c' | 'd')}
                  >
                    {Object.entries(q.options).map(([key, text]) => (
                      <div key={key} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={key} id={`${q.id}-${key}`} className="mt-1" />
                        <Label htmlFor={`${q.id}-${key}`} className="flex-1 cursor-pointer text-muted-foreground">
                          {text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  disabled={sectionIndex === 0}
                  onClick={() => setSectionIndex((i) => i - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="gold"
                  disabled={!sections[sectionIndex].questions.every((q) => answers[q.id])}
                  onClick={() => {
                    if (sectionIndex < sections.length - 1) setSectionIndex((i) => i + 1)
                    else setStage('contact')
                  }}
                >
                  {sectionIndex === sections.length - 1 ? 'See my profile' : 'Next section'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'contact' && (
          <Card>
            <CardHeader>
              <CardTitle>Almost there</CardTitle>
              <CardDescription>Where should we send your results?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Your name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone (optional if email given)</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
                </div>
              </div>

              {error && <p className="text-sm text-rose-500">{error}</p>}

              <Button className="w-full font-bold" variant="gold" onClick={handleSubmitContact} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Show my results
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'results' && profile && (
          <>
            <ResultsCard
              profile={profile}
              tools={tools}
              mentalEnergyScore={mentalEnergyScore}
              learningStrategyScore={learningStrategyScore}
            />
            <Card>
              <CardContent className="p-5 space-y-3">
                {emailedTo && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" /> We&apos;ve emailed your results to {emailedTo}.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {emailedTo && (
                    <Button variant="outline" size="sm" onClick={handleResendEmail} disabled={resendStatus === 'sending'}>
                      {resendStatus === 'sending' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      {resendStatus === 'sent' ? 'Email sent again' : 'Resend email'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleDownloadResults}>
                    <Download className="h-4 w-4 mr-2" /> Download results
                  </Button>
                </div>
                <Button className="w-full font-bold" variant="gold" onClick={() => setStage('feedback')}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {stage === 'feedback' && (
          <Card>
            <CardHeader>
              <CardTitle>One more thing</CardTitle>
              <CardDescription>Now that you&apos;ve seen your profile...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Does this profile feel accurate to you?</Label>
                <div className="flex gap-2 flex-wrap">
                  {(['accurate', 'somewhat', 'not_really'] as const).map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant={accuracyRating === v ? 'gold' : 'outline'}
                      onClick={() => setAccuracyRating(v)}
                    >
                      {v === 'accurate' ? 'Very accurate' : v === 'somewhat' ? 'Somewhat' : 'Not really'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>What&apos;s the biggest challenge in how you currently study? (optional)</Label>
                <Input value={biggestChallenge} onChange={(e) => setBiggestChallenge(e.target.value)} />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Would you like to be contacted about joining Mirror Campus?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={wantsContact === true ? 'gold' : 'outline'}
                    onClick={() => setWantsContact(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={wantsContact === false ? 'gold' : 'outline'}
                    onClick={() => setWantsContact(false)}
                  >
                    No thanks
                  </Button>
                </div>
                {wantsContact && (
                  <Input
                    className="mt-2"
                    placeholder="Preferred contact method (e.g. WhatsApp)"
                    value={contactChannel}
                    onChange={(e) => setContactChannel(e.target.value)}
                  />
                )}
              </div>

              {error && <p className="text-sm text-rose-500">{error}</p>}

              <Button className="w-full font-bold" variant="gold" onClick={handleSubmitFeedback} disabled={submitting}>
                {wantsContact ? 'See where I stand in a subject' : 'Finish'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'picker' && (
          <Card>
            <CardHeader>
              <CardTitle>Want to see where you stand in a subject too?</CardTitle>
              <CardDescription>
                Pick your country, class, and subject — we&apos;ll ground everything in the real curriculum.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Country</Label>
                {countriesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COUNTRIES.filter((c) => c.code !== 'OTHER').map((c) => {
                      const isAvailable = availableCountries.some((a) => a.country_code === c.code)
                      const isSelected = selectedCountryCode === c.code
                      return (
                        <button
                          key={c.code}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSelectCountry(c.code)}
                          className={`text-sm rounded-lg border px-3 py-2 text-left transition ${
                            isSelected
                              ? 'border-gold bg-gold/10 font-medium'
                              : isAvailable
                                ? 'border-slate-200 hover:bg-surface-raised'
                                : 'border-slate-100 text-muted-foreground/50 cursor-not-allowed'
                          }`}
                        >
                          {c.name}
                          {!isAvailable && <span className="block text-[10px] uppercase tracking-wide">Coming soon</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedCountry && levels.length > 0 && (
                <div className="space-y-2">
                  <Label>Class</Label>
                  <div className="flex flex-wrap gap-2">
                    {levels.map((lvl) => (
                      <Button
                        key={lvl}
                        type="button"
                        size="sm"
                        variant={selectedLevel === lvl ? 'gold' : 'outline'}
                        onClick={() => handleSelectLevel(lvl)}
                      >
                        {lvl}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {subjectOptions && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjectOptions.compulsory.map((s) => (
                      <Button
                        key={s.key}
                        type="button"
                        size="sm"
                        variant={selectedSubject?.key === s.key ? 'gold' : 'outline'}
                        onClick={() => handleSelectSubject(s)}
                        disabled={submitting}
                      >
                        {s.label}
                      </Button>
                    ))}
                    {subjectOptions.electives.map((s) => (
                      <Button
                        key={s.key}
                        type="button"
                        size="sm"
                        variant={selectedSubject?.key === s.key ? 'gold' : 'outline'}
                        onClick={() => handleSelectSubject(s)}
                        disabled={submitting}
                      >
                        {s.label}
                      </Button>
                    ))}
                    {subjectOptions.comingSoon.map((s) => (
                      <span
                        key={s.key}
                        className="text-sm rounded-md border border-slate-100 px-3 py-1.5 text-muted-foreground/50 cursor-not-allowed"
                      >
                        {s.label} <span className="text-[10px] uppercase">soon</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-rose-500">{error}</p>}

              <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setStage('cta')}>
                Skip this — take me to sign up
              </button>
            </CardContent>
          </Card>
        )}

        {stage === 'preview' && preview && (
          <Card>
            <CardHeader>
              <CardTitle>{preview.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-surface-raised p-4 space-y-2">
                <p className="text-sm">{preview.explanation}</p>
                <p className="text-sm text-muted-foreground pt-2">Topics covered so far:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {preview.topics_covered.map((t) => (
                    <li key={t}>{titleCase(t)}</li>
                  ))}
                </ul>
              </div>
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <Button className="w-full font-bold" variant="gold" onClick={handleStartDiagnostic} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test myself on this
              </Button>
              <button type="button" className="text-xs text-muted-foreground underline block mx-auto" onClick={() => setStage('cta')}>
                Skip this — take me to sign up
              </button>
            </CardContent>
          </Card>
        )}

        {stage === 'diagnostic' && diagnostic && (
          <Card>
            <CardHeader>
              <CardTitle>{diagnostic.subject} preview quiz</CardTitle>
              <CardDescription>Based on what should already be covered this term.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {diagnostic.questions.map((q, qi) => (
                <div key={qi} className="space-y-2">
                  <p className="font-medium">{q.question}</p>
                  <RadioGroup
                    value={diagAnswers[qi] >= 0 ? String(diagAnswers[qi]) : ''}
                    onValueChange={(v) =>
                      setDiagAnswers((prev) => prev.map((a, i) => (i === qi ? Number(v) : a)))
                    }
                  >
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={String(oi)} id={`d${qi}-${oi}`} className="mt-1" />
                        <Label htmlFor={`d${qi}-${oi}`} className="flex-1 cursor-pointer text-muted-foreground">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <Button
                className="w-full font-bold"
                variant="gold"
                onClick={handleSubmitDiagnostic}
                disabled={submitting || diagAnswers.some((a) => a < 0)}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                See my score
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'diagnostic-results' && diagResult && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">You scored {diagResult.score_pct}%</CardTitle>
              <CardDescription>in {diagResult.subject}, against what&apos;s already been covered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {diagResult.weak_topics.length > 0 && (
                <div className="rounded-xl border bg-surface-raised p-4">
                  <p className="text-sm font-medium mb-2">Topics to focus on:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {diagResult.weak_topics.map((t) => (
                      <li key={t}>{titleCase(t)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button className="w-full font-bold" variant="gold" onClick={() => setStage('cta')}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'cta' && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <CardTitle>Thanks, {fullName || 'friend'}!</CardTitle>
              <CardDescription>
                {wantsContact
                  ? "We'll be in touch. In the meantime, you can start your Mirror Campus journey right now."
                  : 'Ready to put your learning profile to work?'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full font-bold" variant="gold" size="lg">
                <Link href="/student/join">
                  Join Mirror Campus <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

type SubjectsResult = {
  compulsory: CatalogSubjectOption[]
  electives: CatalogSubjectOption[]
  comingSoon: CatalogSubjectOption[]
}

function ResultsCard({
  profile,
  tools,
  mentalEnergyScore,
  learningStrategyScore,
}: {
  profile: PublicCompassProfile
  tools: PublicCompassTool[]
  mentalEnergyScore: number
  learningStrategyScore: number
}) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Your Learning Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Mental Energy Score</p>
            <p className="text-3xl font-bold text-gold">{mentalEnergyScore}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Learning Strategy Score</p>
            <p className="text-3xl font-bold text-emerald-600">{learningStrategyScore}</p>
          </div>
        </div>
        <div className="bg-surface-raised p-6 rounded-xl border border-gold/20">
          <div className="flex items-center space-x-3 mb-3 text-gold">
            {profileIcon(profile.profile_name)}
            <h2 className="text-2xl font-bold text-foreground">{profile.profile_name}</h2>
          </div>
          <p className="text-muted-foreground">{profile.description}</p>
          {profile.focus && <p className="text-sm text-muted-foreground mt-2">Focus: {profile.focus}</p>}
        </div>
        {tools.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Your toolkit</h3>
            {tools.map((tool) => (
              <div key={tool.id} className="border rounded-xl p-4">
                <p className="font-medium">{tool.name}</p>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                {tool.how_to && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">
                    <strong>How to use it:</strong> {tool.how_to}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
