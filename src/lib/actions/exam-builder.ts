'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse, GenerateExamPayload } from '@/lib/types'
import {
  ExamDetectionResult,
  ExamBuilderAssessment,
  ExamVariant,
} from '@/lib/types'

// ── Async generation types ────────────────────────────────────────────────────

export interface ExamJobStatus {
  job_id:   string | number;
  status:   'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;    // 0–100
  exam_id?: string;    // present when COMPLETED — use to redirect to exam editor
  error?:   string;    // present when FAILED
}

// ── Task 0: Detect ────────────────────────────────────────────────────────────

/**
 * Task 0: Upload file and detect curriculum archetype
 */
export async function detectArchetype(
  formData: FormData,
): Promise<ServerActionResponse<ExamDetectionResult>> {
  return await fetcher<ExamDetectionResult>('/exam-builder/detect', {
    method: 'POST',
    body: formData,
  });
}

// ── Task 1: Generate ──────────────────────────────────────────────────────────

/**
 * Task 1: Enqueue exam generation (async).
 *
 * Returns { job_id } immediately — the Gemini call runs in a Bull worker.
 * Poll getExamJobStatus(job_id) every 3 seconds to track progress.
 * When status === COMPLETED, exam_id is returned for redirect to exam editor.
 *
 * Use with the useExamGeneration hook which handles polling automatically.
 */
export async function generateExam(
  payload: GenerateExamPayload,
): Promise<ServerActionResponse<{ job_id: string | number; message: string }>> {
  return await fetcher('/exam-builder/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Poll exam generation job status.
 * Called every 3 seconds by useExamGeneration until COMPLETED or FAILED.
 * On COMPLETED, exam_id is present — redirect to /dashboard/exam-builder/:exam_id
 */
export async function getExamJobStatus(
  jobId: string | number,
): Promise<ServerActionResponse<ExamJobStatus>> {
  const response = await fetcher<ExamJobStatus>(
    `/exam-builder/jobs/${jobId}/status`,
    { cache: 'no-store' },
  );

  // Revalidate assessments list when job completes
  if (response.data?.status === 'COMPLETED' && response.data?.exam_id) {
    revalidatePath('/dashboard/exam-builder');
  }

  return response;
}

// ── Assessments ───────────────────────────────────────────────────────────────

/**
 * List all generated assessments for the current teacher
 */
export async function getExamBuilderAssessments(): Promise<
  ServerActionResponse<ExamBuilderAssessment[]>
> {
  return await fetcher<ExamBuilderAssessment[]>('/exam-builder/assessments', {
    cache: 'no-store',
  });
}

/**
 * Get variants (A and B) for a specific exam
 */
export async function getExamVariants(
  examId: string,
): Promise<ServerActionResponse<ExamVariant[]>> {
  return await fetcher<ExamVariant[]>(`/exam-builder/assessments/${examId}`, {
    cache: 'no-store',
  });
}

// ── Task 2: Marking Guide ─────────────────────────────────────────────────────

/**
 * Task 2: Generate Marking Guide from an existing Exam
 */
export async function generateMarkingGuideAction(payload: {
  exam_id:              string;
  curriculum_archetype: string;
  rubric_style:         string;
  model_answer_depth:   string;
  grade_level?:         string;
  subject?:             string;
}): Promise<ServerActionResponse<any>> {
  return await fetcher<any>(
    `/exam-builder/marking-guide/from-exam/${payload.exam_id}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Fetch an existing marking guide
 */
export async function getMarkingGuide(
  examId: string,
): Promise<ServerActionResponse<any>> {
  return await fetcher<any>(`/exam-builder/marking-guide/${examId}`, {
    cache: 'no-store',
  });
}

// ── Workflow State ────────────────────────────────────────────────────────────

/**
 * Update the workflow state of an assessment (e.g., Draft -> Approved)
 */
export async function updateExamWorkflowState(
  examId: string,
  state: 'draft' | 'under_review' | 'approved' | 'published',
): Promise<ServerActionResponse<{ exam_id: string; workflow_state: string }>> {
  const response = await fetcher<{ exam_id: string; workflow_state: string }>(
    `/exam-builder/assessments/${examId}/state`,
    {
      method: 'PATCH',
      body: JSON.stringify({ workflow_state: state }),
    },
  );

  if (response.data) {
    revalidatePath(`/dashboard/exam-builder/preview/${examId}`);
    revalidatePath('/dashboard/exam-builder');
  }
  return response;
}

/**
 * Update the workflow state of a marking guide
 */
export async function updateMarkingGuideState(
  examId: string,
  state: 'draft' | 'under_review' | 'approved' | 'published',
): Promise<ServerActionResponse<{ exam_id: string; workflow_state: string }>> {
  const response = await fetcher<{ exam_id: string; workflow_state: string }>(
    `/exam-builder/marking-guide/${examId}/state`,
    {
      method: 'PATCH',
      body: JSON.stringify({ workflow_state: state }),
    },
  );

  if (response.data) {
    revalidatePath(`/dashboard/exam-builder/marking`);
  }
  return response;
}

// ── Variants ──────────────────────────────────────────────────────────────────

/**
 * Manual Edit: Update the JSON content of a specific variant
 */
export async function updateVariantContent(
  variantId: string,
  content: any,
): Promise<ServerActionResponse<any>> {
  const response = await fetcher<any>(`/exam-builder/variants/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });

  if (response.data) {
    revalidatePath(`/dashboard/exam-builder/preview/${response.data.examId}`);
  }
  return response;
}

// ── Image Generation ──────────────────────────────────────────────────────────

/**
 * Generate an academic diagram/image using Imagen 3
 */
export async function generateImageAction(
  prompt: string,
): Promise<ServerActionResponse<{ url: string }>> {
  return await fetcher<{ url: string }>('/exam-builder/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}