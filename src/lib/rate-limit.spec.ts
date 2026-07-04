import { checkReservationRateLimit } from '@/lib/rate-limit'
import { describe, expect, it } from 'vitest'

describe('reservation rate limit', () => {
  it('allows 20 requests per user per minute and blocks the 21st', () => {
    const userId = `user-${crypto.randomUUID()}`

    for (let index = 0; index < 20; index++) {
      expect(checkReservationRateLimit(userId)).toBe(true)
    }

    expect(checkReservationRateLimit(userId)).toBe(false)
  })
})
