const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkReservationRateLimit(userId: string) {
  const now = Date.now()
  const bucket = buckets.get(userId)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false
  }

  bucket.count += 1
  return true
}
