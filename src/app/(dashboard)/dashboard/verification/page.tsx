import { getMyVerification } from '@/lib/actions/school-verification'
import { VerificationClient } from './_components/verification-client'

export default async function VerificationPage() {
  const { data: verification } = await getMyVerification()
  return <VerificationClient verification={verification} />
}
