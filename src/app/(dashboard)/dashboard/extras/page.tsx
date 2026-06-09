import { listMyOrgExtras } from '@/lib/actions/extras'
import { ExtrasAdminClient } from './_components/extras-admin-client'

export default async function ExtrasAdminPage() {
  const extrasRes = await listMyOrgExtras()

  return (
    <ExtrasAdminClient
      extras={extrasRes.data ?? []}
    />
  )
}
