'use server'

import { fetcher } from '@/lib/fetch'

export interface PlatformStats {
  organizations: number
  users:         number
  assessments:   number
}

export interface OrgSummary {
  organization_id:     string
  name:                string
  school_code:         string | null
  type:                string | null
  country_code:        string | null
  subscription_tier:   string | null
  is_active:           boolean
  onboarding_complete: boolean
  createdAt:           string
}

export interface OrgDetail extends OrgSummary {
  stats: { users: number; assessments: number }
}

export interface OrgUser {
  user_id:    string
  email:      string
  first_name: string | null
  last_name:  string | null
  is_active:  boolean
  createdAt:  string
  role:       string | null
}

export interface OrgAssessment {
  assessment_id: string
  title:         string
  is_published:  boolean
  audit_status:  string | null
  is_system:     boolean
  createdAt:     string
}

export interface AuditLogEntry {
  id:            string
  actor_id:      string | null
  actor_role:    string
  action:        string
  resource_type: string
  resource_id:   string | null
  org_context:   string | null
  ip_address:    string | null
  metadata:      Record<string, unknown> | null
  created_at:    string
}

export async function getPlatformStats() {
  return fetcher<PlatformStats>('/root/stats')
}

export async function getOrganizations(limit = 50, offset = 0) {
  return fetcher<OrgSummary[]>(`/root/organizations?limit=${limit}&offset=${offset}`)
}

export async function getOrganization(id: string) {
  return fetcher<OrgDetail>(`/root/organizations/${id}`)
}

export async function getOrgUsers(id: string) {
  return fetcher<OrgUser[]>(`/root/organizations/${id}/users`)
}

export async function getOrgAssessments(id: string) {
  return fetcher<OrgAssessment[]>(`/root/organizations/${id}/assessments`)
}

export async function getSystemAssessments() {
  return fetcher<OrgAssessment[]>('/root/system-assessments')
}

export async function suspendOrganization(id: string) {
  return fetcher<OrgDetail>(`/root/organizations/${id}/suspend`, { method: 'PATCH' })
}

export async function activateOrganization(id: string) {
  return fetcher<OrgDetail>(`/root/organizations/${id}/activate`, { method: 'PATCH' })
}

export async function updateSubscription(id: string, tier: string) {
  return fetcher<OrgDetail>(`/root/organizations/${id}/subscription`, {
    method: 'PATCH',
    body: JSON.stringify({ tier }),
  })
}

export async function getAuditLogs(params?: {
  orgContext?:   string
  actorId?:      string
  resourceType?: string
  action?:       string
  limit?:        number
  offset?:       number
}) {
  const q = new URLSearchParams()
  if (params?.orgContext)   q.set('orgContext',   params.orgContext)
  if (params?.actorId)      q.set('actorId',      params.actorId)
  if (params?.resourceType) q.set('resourceType', params.resourceType)
  if (params?.action)       q.set('action',       params.action)
  if (params?.limit)        q.set('limit',        String(params.limit))
  if (params?.offset)       q.set('offset',       String(params.offset))
  const qs = q.toString()
  return fetcher<AuditLogEntry[]>(`/root/audit-logs${qs ? `?${qs}` : ''}`)
}

// ── Org profile edit ──────────────────────────────────────────────────────────

export async function updateOrgProfile(id: string, data: { name?: string; type?: string; country?: string }) {
  return fetcher<OrgDetail>(`/root/organizations/${id}/profile`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

// ── System assessments ────────────────────────────────────────────────────────

export interface SystemAssessment extends OrgAssessment {
  is_visible_to_orgs: boolean
}

export async function publishSystemAssessment(id: string, publish: boolean) {
  return fetcher<SystemAssessment>(`/root/system-assessments/${id}/publish`, {
    method: 'PATCH',
    body:   JSON.stringify({ publish }),
  })
}

export async function setSystemAssessmentVisibility(id: string, visible: boolean) {
  return fetcher<SystemAssessment>(`/root/system-assessments/${id}/visibility`, {
    method: 'PATCH',
    body:   JSON.stringify({ visible }),
  })
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

export interface BroadcastResult {
  recipient_count: number
}

export async function broadcastAnnouncement(data: {
  title:      string
  message:    string
  targetType: 'ALL' | 'ADMINS' | 'TEACHERS' | 'STUDENTS' | 'ORG'
  orgId?:     string
}) {
  return fetcher<BroadcastResult>('/root/broadcast', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

export async function getBroadcastHistory(limit = 50, offset = 0) {
  return fetcher<AuditLogEntry[]>(`/root/broadcasts?limit=${limit}&offset=${offset}`)
}

// ── Curricula ─────────────────────────────────────────────────────────────────

export interface CurriculumSummary {
  schema_id:        string
  subject:          string
  curriculum_body:  string
  curriculum_level: string
  country:          string
  version:          string
  status:           string
  updated_at:       string
}

export interface ValidationViolation {
  id:        string
  field:     string
  severity:  'error' | 'warning'
  message:   string
  current?:  unknown
  expected?: string
}

export interface CurriculumUpdateResult {
  saved:      boolean
  violations: ValidationViolation[]
}

export async function getRootCurricula() {
  return fetcher<CurriculumSummary[]>('/root/curricula')
}

export async function getRootCurriculumById(id: string) {
  return fetcher<Record<string, unknown>>(`/root/curricula/${id}`)
}

export async function validateCurriculumSchema(id: string, schemaData: Record<string, unknown>) {
  return fetcher<CurriculumUpdateResult>(`/root/curricula/${id}/validate`, {
    method: 'POST',
    body:   JSON.stringify({ schema_data: schemaData }),
  })
}

export async function updateCurriculumSchema(
  id: string,
  schemaData: Record<string, unknown>,
  overrideWarnings?: string[],
  overrideReason?: string,
) {
  return fetcher<CurriculumUpdateResult>(`/root/curricula/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify({ schema_data: schemaData, override_warnings: overrideWarnings, override_reason: overrideReason }),
  })
}

export async function reloadCurriculaFromFiles() {
  return fetcher<{ loaded: number }>('/root/curricula/reload', { method: 'POST' })
}

export async function createCurriculumSchema(data: {
  country:          string
  curriculum_body:  string
  curriculum_level: string
  subject:          string
  subject_code:     string
}) {
  return fetcher<{ schema_id: string }>('/root/curricula', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

export async function updateCurriculumSchemaWithNote(
  id: string,
  schemaData: Record<string, unknown>,
  changeNote?: string,
  overrideWarnings?: string[],
  overrideReason?: string,
  source?: string,
) {
  return fetcher<CurriculumUpdateResult>(`/root/curricula/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify({
      schema_data:       schemaData,
      change_note:       changeNote,
      override_warnings: overrideWarnings,
      override_reason:   overrideReason,
      source,
    }),
  })
}

export interface CurriculumSchemaVersion {
  id:          string
  schema_id:   string
  version_num: number
  schema_data: Record<string, unknown>
  changed_by:  string | null
  change_note: string | null
  source:      string
  created_at:  string
}

export async function getCurriculumVersions(id: string) {
  return fetcher<CurriculumSchemaVersion[]>(`/root/curricula/${id}/versions`)
}

export async function restoreCurriculumVersion(id: string, versionId: string) {
  return fetcher<{ schema_id: string; restored_from_version: number }>(
    `/root/curricula/${id}/restore/${versionId}`,
    { method: 'POST' },
  )
}

export interface AiFillResult {
  sections_affected: string[]
  proposed_patch:    Record<string, unknown>
}

export async function aiSuggestFill(
  id: string,
  data: { file_base64?: string; file_url?: string; mime_type: string; instructions?: string },
) {
  return fetcher<AiFillResult>(`/root/curricula/${id}/ai-fill`, {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

export interface CorpusTopicPreview {
  topic_id:    string | null
  topic_name:  string
  chunk_count: number
  class_levels: string[]
  terms:       string[]
  periods:     number | null
  page_ref:    number | null
  bloom_counts: Record<string, number>
}

export interface CorpusPreview {
  subject:          string
  curriculum_level: string
  total_chunks:     number
  topics:           CorpusTopicPreview[]
}

export interface EnrichResult {
  schemaId:      string
  topicsAdded:   number
  outcomesAdded: number
}

export async function getCorpusPreview(id: string) {
  return fetcher<CorpusPreview>(`/root/curricula/${id}/corpus-preview`)
}

export async function enrichFromCorpus(id: string) {
  return fetcher<EnrichResult>(`/root/curricula/${id}/enrich-from-corpus`, {
    method: 'POST',
  })
}

export async function enrichAllFromCorpus() {
  return fetcher<{ results: EnrichResult[]; failed: { schemaId: string; error: string }[] }>(
    '/root/curricula/enrich-all-from-corpus',
    { method: 'POST' },
  )
}

export async function enrichFromRelated(id: string) {
  return fetcher<EnrichResult>(`/root/curricula/${id}/enrich-from-related`, { method: 'POST' })
}

export async function enrichAllFromRelated() {
  return fetcher<{ results: EnrichResult[]; failed: { schemaId: string; error: string }[] }>(
    '/root/curricula/enrich-all-from-related',
    { method: 'POST' },
  )
}

// ── Roles & Permissions ───────────────────────────────────────────────────────

export interface RoleWithPermissions {
  role_id:     string
  role_name:   string
  description: string | null
  permissions: string[]
  createdAt:   string
}

export interface PermissionItem {
  permission_id: string
  key:           string
  description:   string
  category:      string
}

export async function getRoles() {
  return fetcher<RoleWithPermissions[]>('/root/roles')
}

export async function createRole(data: { role_name: string; description?: string; permissions?: string[] }) {
  return fetcher<RoleWithPermissions>('/root/roles', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

export async function updateRole(id: string, data: { role_name?: string; description?: string }) {
  return fetcher<RoleWithPermissions>(`/root/roles/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

export async function deleteRole(id: string) {
  return fetcher<{ success: boolean }>(`/root/roles/${id}`, { method: 'DELETE' })
}

export async function getPermissions() {
  return fetcher<PermissionItem[]>('/root/permissions')
}

export async function setRolePermissions(roleId: string, permissions: string[]) {
  return fetcher<{ success: boolean }>(`/root/roles/${roleId}/permissions`, {
    method: 'PATCH',
    body:   JSON.stringify({ permissions }),
  })
}

// ── Support inbox ─────────────────────────────────────────────────────────────

export interface SupportMessage {
  id:         string
  name:       string
  email:      string
  topic:      string
  message:    string
  status:     'new' | 'read' | 'resolved'
  created_at: string
}

export async function getSupportMessages(status?: string) {
  const qs = status ? `?status=${status}` : ''
  return fetcher<SupportMessage[]>(`/support/messages${qs}`)
}

export async function markSupportMessageRead(id: string) {
  return fetcher<{ message: string }>(`/support/messages/${id}/read`, { method: 'PATCH' })
}

export async function markSupportMessageResolved(id: string) {
  return fetcher<{ message: string }>(`/support/messages/${id}/resolve`, { method: 'PATCH' })
}
