'use server'

import { fetcher } from '@/lib/fetch'

export interface SchoolVerification {
  id:            string
  org_id:        string
  documents_url: string[] | null
  status:        'pending' | 'approved' | 'rejected' | 'more_info'
  reviewed_at?:  string | null
  notes?:        string | null
  createdAt:     string
  updatedAt?:    string
}

export interface SchoolVerificationWithOrg extends SchoolVerification {
  org_name:    string
  school_code: string | null
}

export async function submitVerification(documentsUrl: string[]) {
  return fetcher<SchoolVerification>('/school-verification/submit', {
    method: 'POST',
    body: JSON.stringify({ documents_url: documentsUrl }),
  })
}

export async function getMyVerification() {
  return fetcher<SchoolVerification>('/school-verification/my')
}

export async function listVerifications() {
  return fetcher<SchoolVerificationWithOrg[]>('/school-verification/all')
}

export async function reviewVerification(
  id:       string,
  decision: 'approved' | 'rejected' | 'more_info',
  notes?:   string,
) {
  return fetcher<SchoolVerification>(`/school-verification/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, notes }),
  })
}
