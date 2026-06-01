import { redirect } from 'next/navigation'

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/dashboard/assessments/${slug}`)
}
