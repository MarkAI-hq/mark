import { GuardianPayClient } from './_components/guardian-pay-client'

export const metadata = {
  title: 'Term Fee Payment · Mirror Intelligence',
}

export default async function GuardianPayPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <main className="min-h-screen bg-surface-base flex items-start justify-center px-4 py-10">
      <GuardianPayClient token={token} />
    </main>
  )
}
