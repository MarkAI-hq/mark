'use server';

import { fetcher } from '@/lib/fetch';
import { ServerActionResponse } from '@/lib/types';

export interface ExamRegistration {
  id: string;
  exam_body: string;
  exam_type: string;
  exam_session: string | null;
  fee_usd: string;
  status: string;
  registration_number: string | null;
  result_grade?: string | null;
  result_status?: string | null; // 'passed' | 'failed' | null
}

export interface RegisterExamPayload {
  exam_body: string;
  exam_type: string;
  exam_session?: string;
  fee_usd: number;
}

export async function registerForExam(
  payload: RegisterExamPayload,
): Promise<ServerActionResponse<{ checkout_url: string; registration_id: string }>> {
  return fetcher<{ checkout_url: string; registration_id: string }>(
    '/exam-registrations',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function getMyExamRegistrations(): Promise<
  ServerActionResponse<ExamRegistration[]>
> {
  return fetcher<ExamRegistration[]>('/exam-registrations/my');
}

export async function getOrgExamRegistrations(): Promise<
  ServerActionResponse<ExamRegistration[]>
> {
  return fetcher<ExamRegistration[]>('/exam-registrations/org');
}

export async function markExamRegistrationAsRegistered(
  id: string,
): Promise<ServerActionResponse<void>> {
  return fetcher<void>(`/exam-registrations/${id}/mark-registered`, {
    method: 'PATCH',
  });
}
