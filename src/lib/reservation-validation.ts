import {
  BUSINESS_HOURS_ERROR,
  isValidBusinessEndIso,
  isValidBusinessReservationRange,
  isValidBusinessStartIso,
} from '@/lib/reservation-client'
import { z } from 'zod'

const isoDateSchema = z.string().datetime()

export const reservationRangeQuerySchema = z.object({
  start: isoDateSchema,
  end: isoDateSchema,
})

export const createReservationSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    notes: z.string().trim().max(2000).optional().nullable(),
    startsAt: isoDateSchema,
    endsAt: isoDateSchema,
    needsPrivacy: z.boolean().default(false),
  })
  .refine((data) => new Date(data.startsAt) < new Date(data.endsAt), {
    message: 'O inicio deve ser anterior ao termino.',
    path: ['endsAt'],
  })
  .refine(
    (data) => isValidBusinessReservationRange(data.startsAt, data.endsAt),
    {
      message: BUSINESS_HOURS_ERROR,
      path: ['startsAt'],
    },
  )

export const updateReservationSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
    startsAt: isoDateSchema.optional(),
    endsAt: isoDateSchema.optional(),
    needsPrivacy: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) {
        return true
      }

      return new Date(data.startsAt) < new Date(data.endsAt)
    },
    {
      message: 'O inicio deve ser anterior ao termino.',
      path: ['endsAt'],
    },
  )
  .refine((data) => !data.startsAt || isValidBusinessStartIso(data.startsAt), {
    message: BUSINESS_HOURS_ERROR,
    path: ['startsAt'],
  })
  .refine((data) => !data.endsAt || isValidBusinessEndIso(data.endsAt), {
    message: BUSINESS_HOURS_ERROR,
    path: ['endsAt'],
  })

export function isOverlapError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    code?: string
    meta?: { code?: string; database_error?: string }
    message?: string
  }

  return (
    candidate.code === '23P01' ||
    candidate.meta?.code === '23P01' ||
    candidate.meta?.database_error?.includes('23P01') ||
    candidate.message?.includes('reservations_no_overlap') === true
  )
}
