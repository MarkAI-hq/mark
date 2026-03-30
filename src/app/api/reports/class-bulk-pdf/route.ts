// src/app/api/reports/class-bulk-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token       = cookieStore.get('token')?.value
  const baseUrl     = process.env.API_BASE_URL

  if (!baseUrl) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  const { classId, className, studentIds } = await req.json() as {
    classId:    string
    className:  string
    studentIds: { id: string; name: string }[]
  }

  if (!classId || !studentIds?.length) {
    return NextResponse.json({ error: 'classId and studentIds are required' }, { status: 400 })
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const chunkSize = 5
  const zip = new JSZip()
  const folder = zip.folder(className ?? 'class-reports')!
  const failed: string[] = []

  for (let i = 0; i < studentIds.length; i += chunkSize) {
    const chunk = studentIds.slice(i, i + chunkSize)

    await Promise.all(
      chunk.map(async ({ id, name }) => {
        try {
          const res = await fetch(`${baseUrl}/api/v1/reports/student-performance`, {
            method:  'POST',
            headers,
            body:    JSON.stringify({ studentId: id, classId }),
          })

          if (!res.ok) {
            failed.push(name)
            return
          }

          const buffer = await res.arrayBuffer()
          const safeName = name.replace(/[^a-z0-9_\- ]/gi, '_').trim()
          folder.file(`${safeName}_Report.pdf`, buffer)
        } catch {
          failed.push(name)
        }
      }),
    )
  }

  if (folder.length === 0) {
    return NextResponse.json(
      { error: 'No reports could be generated.' },
      { status: 500 },
    )
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  const safeClass = (className ?? 'class').replace(/[^a-z0-9_\- ]/gi, '_').trim()

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${safeClass}_Reports.zip"`,
      ...(failed.length > 0 && { 'X-Failed-Students': failed.join(', ') }),
    },
  })
}