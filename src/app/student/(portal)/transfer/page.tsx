// src/app/student/(portal)/transfer/page.tsx
import { getMyTransfers } from '@/lib/actions/transfers'
import { TransferClient } from './_components/transfer-client'

export default async function TransferPage() {
  const res = await getMyTransfers()
  return <TransferClient transfers={res.data ?? []} />
}
