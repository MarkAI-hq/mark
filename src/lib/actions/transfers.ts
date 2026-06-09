'use server';

import { fetcher } from '@/lib/fetch';
import { ServerActionResponse } from '@/lib/types';

export interface Transfer {
  id: string;
  status: string;
  from_org_id: string;
  to_org_id: string;
  requested_at: string;
  completed_at: string | null;
}

export async function requestTransfer(
  targetSchoolCode: string,
): Promise<ServerActionResponse<{ checkout_url: string; transfer_id: string }>> {
  return fetcher<{ checkout_url: string; transfer_id: string }>('/transfers/request', {
    method: 'POST',
    body: JSON.stringify({ target_school_code: targetSchoolCode }),
  });
}

export async function getMyTransfers(): Promise<ServerActionResponse<Transfer[]>> {
  return fetcher<Transfer[]>('/transfers/my');
}
