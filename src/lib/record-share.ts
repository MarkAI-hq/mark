// Signed, expiring tokens for public "proof of learning" share links.
//
// Server-only: relies on RECORD_SHARE_SECRET and Node crypto. Never import
// this from a client component — only from route handlers / server actions.
//
// Token format: `<expiryMs>.<base64url(HMAC-SHA256(studentId.expiryMs))>`.
// Self-contained (no DB) — verification recomputes the HMAC and checks expiry.

import crypto from 'crypto'

const SECRET = process.env.RECORD_SHARE_SECRET ?? ''
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export function recordShareConfigured(): boolean {
  return SECRET.length > 0
}

function sign(studentId: string, exp: number): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${studentId}.${exp}`)
    .digest('base64url')
}

/** Mint a signed token for a student record, valid for `ttlMs` (default 30 days). */
export function signRecordToken(studentId: string, ttlMs = DEFAULT_TTL_MS): string {
  if (!SECRET) throw new Error('RECORD_SHARE_SECRET is not configured')
  const exp = Date.now() + ttlMs
  return `${exp}.${sign(studentId, exp)}`
}

/** Verify a token belongs to `studentId`, is unexpired, and was signed by us. */
export function verifyRecordToken(
  studentId: string,
  token: string | null | undefined,
): boolean {
  if (!SECRET || !token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false

  const exp = Number(token.slice(0, dot))
  const sig = token.slice(dot + 1)
  if (!Number.isFinite(exp) || exp < Date.now()) return false

  const expected = sign(studentId, exp)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
