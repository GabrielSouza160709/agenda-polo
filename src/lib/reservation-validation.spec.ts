import { BUSINESS_HOURS_ERROR } from '@/lib/reservation-client'
import {
  createReservationSchema,
  updateReservationSchema,
} from '@/lib/reservation-validation'
import { describe, expect, it } from 'vitest'

describe('reservation API validation', () => {
  const validReservation = {
    title: 'Reuniao comercial',
    notes: null,
    startsAt: '2030-01-10T12:00:00.000Z',
    endsAt: '2030-01-10T13:00:00.000Z',
    needsPrivacy: false,
  }

  it('accepts reservations inside business hours', () => {
    expect(createReservationSchema.safeParse(validReservation).success).toBe(
      true,
    )
  })

  it('rejects create requests before business hours', () => {
    const result = createReservationSchema.safeParse({
      ...validReservation,
      startsAt: '2030-01-10T08:00:00.000Z',
      endsAt: '2030-01-10T09:00:00.000Z',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(BUSINESS_HOURS_ERROR)
    }
  })

  it('rejects update requests after business hours', () => {
    const result = updateReservationSchema.safeParse({
      startsAt: '2030-01-10T23:00:00.000Z',
      endsAt: '2030-01-11T00:00:00.000Z',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(BUSINESS_HOURS_ERROR)
    }
  })
})
