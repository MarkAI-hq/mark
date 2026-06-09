'use server';

import { fetcher } from '@/lib/fetch';
import { ServerActionResponse } from '@/lib/types';

export interface SchoolExtra {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string;
  price_usd: string;
  is_free: boolean;
  is_active: boolean;
  max_enrollment: number | null;
}

export interface SchoolExtraWithStats extends Omit<SchoolExtra, 'org_id'> {
  enrollment_count: number;
}

export interface ExtraEnrollment {
  id: string;
  extra_id: string;
  status: string;
  enrolled_at: string;
  extra?: SchoolExtra;
}

export interface CreateExtraPayload {
  name: string;
  description?: string;
  category?: string;
  price_usd?: number;
  is_free?: boolean;
  max_enrollment?: number | null;
}

export async function listExtrasForSchool(
  schoolCode: string,
): Promise<ServerActionResponse<SchoolExtra[]>> {
  return fetcher<SchoolExtra[]>(`/extras/school/${schoolCode}`);
}

export async function listMyOrgExtras(): Promise<ServerActionResponse<SchoolExtra[]>> {
  return fetcher<SchoolExtra[]>('/extras/org');
}

export async function listMyOrgExtrasWithStats(): Promise<ServerActionResponse<SchoolExtraWithStats[]>> {
  return fetcher<SchoolExtraWithStats[]>('/extras/org/stats');
}

export async function createExtra(
  payload: CreateExtraPayload,
): Promise<ServerActionResponse<SchoolExtra>> {
  return fetcher<SchoolExtra>('/extras', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExtra(
  id: string,
  payload: Partial<CreateExtraPayload & { is_active: boolean }>,
): Promise<ServerActionResponse<SchoolExtra>> {
  return fetcher<SchoolExtra>(`/extras/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function enrollInExtra(
  extraId: string,
): Promise<ServerActionResponse<{ checkout_url?: string; enrolled: boolean }>> {
  return fetcher<{ checkout_url?: string; enrolled: boolean }>(
    `/extras/${extraId}/enroll`,
    { method: 'POST' },
  );
}

export async function getMyEnrollments(): Promise<ServerActionResponse<ExtraEnrollment[]>> {
  return fetcher<ExtraEnrollment[]>('/extras/my');
}
