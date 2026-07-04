import {
  BUSINESS_HOURS_ERROR,
  ROOM_TIME_ZONE,
  defaultReservationFormValues,
  localFieldsToIso,
  validateReservationForm,
  isTimeWithinBoundaries,
} from '@/lib/reservation-client'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it, vi } from 'vitest'

describe('reservation client validation', () => {
  it('converts local Sao Paulo fields to UTC ISO strings', () => {
    const iso = localFieldsToIso('2030-01-10', '09:30')
    const local = Temporal.Instant.from(iso).toZonedDateTimeISO(ROOM_TIME_ZONE)

    expect(local.toPlainDate().toString()).toBe('2030-01-10')
    expect(local.hour).toBe(9)
    expect(local.minute).toBe(30)
  })

  it('rejects reservations shorter than 15 minutes', () => {
    const error = validateReservationForm({
      title: 'Reuniao',
      date: '2030-01-10',
      startsAt: '09:00',
      endsAt: '09:10',
      needsPrivacy: false,
      notes: '',
    })

    expect(error).toBe('A duracao minima e de 15 minutos.')
  })

  it('rejects starts after ends', () => {
    const error = validateReservationForm({
      title: 'Reuniao',
      date: '2030-01-10',
      startsAt: '10:00',
      endsAt: '09:00',
      needsPrivacy: false,
      notes: '',
    })

    expect(error).toBe('O inicio deve ser anterior ao termino.')
  })

  it('rejects reservation times before business hours', () => {
    const error = validateReservationForm({
      title: 'Reuniao',
      date: '2030-01-10',
      startsAt: '05:00',
      endsAt: '06:00',
      needsPrivacy: false,
      notes: '',
    })

    expect(error).toBe(BUSINESS_HOURS_ERROR)
  })

  it('rejects reservation times after business hours', () => {
    const error = validateReservationForm({
      title: 'Reuniao',
      date: '2030-01-10',
      startsAt: '20:00',
      endsAt: '21:00',
      needsPrivacy: false,
      notes: '',
    })

    expect(error).toBe(BUSINESS_HOURS_ERROR)
  })

  it('accepts reservation times inside business hours', () => {
    const error = validateReservationForm({
      title: 'Reuniao',
      date: '2030-01-10',
      startsAt: '09:00',
      endsAt: '10:00',
      needsPrivacy: false,
      notes: '',
    })

    expect(error).toBeNull()
  })

  it('rejects reservations in the past', () => {
    vi.setSystemTime(new Date('2030-01-10T12:00:00.000Z'))

    const error = validateReservationForm({
      title: 'Reuniao',
      date: '2029-01-10',
      startsAt: '09:00',
      endsAt: '10:00',
      needsPrivacy: false,
      notes: '',
    })

    expect(error).toBe('Nao e possivel criar uma reserva no passado.')
    vi.useRealTimers()
  })

  it('creates default values with a one hour duration', () => {
    const values = defaultReservationFormValues(
      new Date('2030-01-10T12:00:00Z'),
    )

    expect(values.title).toBe('')
    expect(values.needsPrivacy).toBe(false)
    expect(values.startsAt).not.toBe(values.endsAt)
  })

  it('rolls default values to the next business day when they would cross midnight', () => {
    const values = defaultReservationFormValues(
      new Date('2030-01-11T02:45:00Z'),
    )

    expect(values.date).toBe('2030-01-11')
    expect(values.startsAt).toBe('08:00')
    expect(values.endsAt).toBe('09:00')
  })

  describe('isTimeWithinBoundaries', () => {
    it('returns false for 05:59', () => {
      const dt = Temporal.ZonedDateTime.from('2030-01-10T05:59:00[America/Sao_Paulo]')
      expect(isTimeWithinBoundaries(dt)).toBe(false)
    })

    it('returns true for 06:00', () => {
      const dt = Temporal.ZonedDateTime.from('2030-01-10T06:00:00[America/Sao_Paulo]')
      expect(isTimeWithinBoundaries(dt)).toBe(true)
    })

    it('returns true for 12:00', () => {
      const dt = Temporal.ZonedDateTime.from('2030-01-10T12:00:00[America/Sao_Paulo]')
      expect(isTimeWithinBoundaries(dt)).toBe(true)
    })

    it('returns true for 19:59', () => {
      const dt = Temporal.ZonedDateTime.from('2030-01-10T19:59:00[America/Sao_Paulo]')
      expect(isTimeWithinBoundaries(dt)).toBe(true)
    })

    it('returns false for 20:00', () => {
      const dt = Temporal.ZonedDateTime.from('2030-01-10T20:00:00[America/Sao_Paulo]')
      expect(isTimeWithinBoundaries(dt)).toBe(false)
    })

    it('returns false for 21:00', () => {
      const dt = Temporal.ZonedDateTime.from('2030-01-10T21:00:00[America/Sao_Paulo]')
      expect(isTimeWithinBoundaries(dt)).toBe(false)
    })
  })
})
