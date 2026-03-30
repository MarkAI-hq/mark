// src/app/api/reports/cognitive-profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token       = cookieStore.get('token')?.value
  const baseUrl     = process.env.API_BASE_URL

  if (!baseUrl) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  const { studentId, classId } = await req.json()

  // Fetch student info, class info, and cognitive profiles in parallel
  const [profileRes, studentRes, classRes] = await Promise.all([
    fetch(`${baseUrl}/api/v1/cognitive/students/${studentId}/cognitive-profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/v1/students/${studentId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/v1/academics/classes/${classId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: 'no-store',
    }),
  ])

  const profileJson  = profileRes.ok  ? await profileRes.json()  : null
  const studentJson  = studentRes.ok  ? await studentRes.json()  : null
  const classJson    = classRes.ok    ? await classRes.json()    : null

  // Unwrap backend response envelope ({ data: [...] } or raw array)
  const profiles = Array.isArray(profileJson?.data)
    ? profileJson.data
    : Array.isArray(profileJson)
    ? profileJson
    : []

  const currentProfile =
    profiles.find((p: any) => p.is_current) ?? profiles[0] ?? null

  const studentData = studentJson?.data ?? studentJson ?? {}
  const classData   = classJson?.data   ?? classJson   ?? {}

  const studentName =
    [studentData.first_name, studentData.last_name].filter(Boolean).join(' ').trim()
    || 'Student'

  const className = classData.name ?? 'Unknown Class'

  // Build GenerateCognitiveReportDto
  const dto = {
    studentName,
    className,
    scores: {
      mentalEnergy:     currentProfile?.mental_energy_score     ?? 0,
      learningStrategy: currentProfile?.learning_strategy_score ?? 0,
    },
    profile: {
      name:        currentProfile?.profile_name        ?? 'Cognitive Profile',
      description: currentProfile?.profile_description ?? 'No profile description available.',
    },
    selectedTools: currentProfile?.recommended_tools ?? [],
  }

  // Call the NestJS backend to generate the PDF
  const pdfRes = await fetch(`${baseUrl}/api/v1/reports/cognitive-profile`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(dto),
  })

  if (!pdfRes.ok) {
    const msg = await pdfRes.text()
    return NextResponse.json({ error: msg }, { status: pdfRes.status })
  }

  const pdfBuffer = await pdfRes.arrayBuffer()

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename=${studentName.replace(/\s+/g, '_')}_Cognitive_Profile.pdf`,
    },
  })
}