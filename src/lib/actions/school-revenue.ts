'use server';

import { cache } from 'react';
import { fetcher } from '@/lib/fetch';
import { ServerActionResponse } from '@/lib/types';

export interface EarningsByType {
  transaction_type: string;
  total_gross: string | null;
  total_school_cut: string | null;
  total_mark_cut: string | null;
  count: number;
}

export interface SchoolEarnings {
  total_gross: number;
  total_school_cut: number;
  by_type: EarningsByType[];
}

export interface SchoolStats {
  student_count: number;
  certificates_issued: number;
  total_gross_usd: number;
  total_school_revenue_usd: number;
  currency: string;
}

export async function getSchoolEarnings(): Promise<ServerActionResponse<SchoolEarnings>> {
  return fetcher<SchoolEarnings>('/organizations/my/earnings');
}

export const getSchoolStats = cache(
  async (): Promise<ServerActionResponse<SchoolStats>> =>
    fetcher<SchoolStats>('/organizations/my/stats'),
)

export async function updateOrgCurrency(currency: string): Promise<ServerActionResponse<{ currency: string }>> {
  return fetcher<{ currency: string }>('/organizations/my/settings', {
    method: 'PATCH',
    body: JSON.stringify({ currency }),
  });
}
