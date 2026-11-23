// Base URL for server-side Route Handlers calling mark-api directly.
//
// MIRROR_API_URL is set both with and without the /api/v1 prefix across
// environments (e.g. .env.local has "http://localhost:4000"), and the routes
// that read it all assumed the prefix was included, so they 404'd ("Cannot
// POST /upload") wherever it wasn't. Normalise once here.
export function mirrorApiUrl(): string {
  const raw = (process.env.MIRROR_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '')
  return /\/api\/v1$/.test(raw) ? raw : `${raw}/api/v1`
}
