import { Temporal } from 'temporal-polyfill'

export const ROOM_TIME_ZONE = 'America/Sao_Paulo'
export const BUSINESS_HOURS_ERROR =
  'Reservas permitidas apenas entre 06:00 e 20:00'
export const BUSINESS_HOURS = {
  start: '06:00',
  earliestEnd: '06:15',
  latestStart: '19:45',
  end: '20:00',
} as const

const MIN_RESERVATION_MINUTES = 15
const BUSINESS_START_MINUTES = 6 * 60
const BUSINESS_END_MINUTES = 20 * 60
const EARLIEST_END_MINUTES = BUSINESS_START_MINUTES + MIN_RESERVATION_MINUTES
const LATEST_START_MINUTES = BUSINESS_END_MINUTES - MIN_RESERVATION_MINUTES

export interface ReservationDTO {
  id: string
  title: string
  notes: string | null
  startsAt: string
  endsAt: string
  needsPrivacy: boolean
  status: 'CONFIRMED' | 'CANCELLED'
  version: number
  creator: {
    id: string
    name: string
    image: string | null
  }
  canEdit: boolean
}

export interface ReservationFormValues {
  title: string
  date: string
  startsAt: string
  endsAt: string
  needsPrivacy: boolean
  notes: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesFromIso(iso: string) {
  const zoned = zonedFromIso(iso)
  return zoned.hour * 60 + zoned.minute
}

export function isValidBusinessStartTime(time: string) {
  const minutes = minutesFromTime(time)
  return (
    Number.isFinite(minutes) &&
    minutes >= BUSINESS_START_MINUTES &&
    minutes <= LATEST_START_MINUTES
  )
}

export function isValidBusinessEndTime(time: string) {
  const minutes = minutesFromTime(time)
  return (
    Number.isFinite(minutes) &&
    minutes >= EARLIEST_END_MINUTES &&
    minutes <= BUSINESS_END_MINUTES
  )
}

export function isValidBusinessStartIso(iso: string) {
  const minutes = minutesFromIso(iso)
  return minutes >= BUSINESS_START_MINUTES && minutes <= LATEST_START_MINUTES
}

export function isValidBusinessEndIso(iso: string) {
  const minutes = minutesFromIso(iso)
  return minutes >= EARLIEST_END_MINUTES && minutes <= BUSINESS_END_MINUTES
}

export function isValidBusinessReservationRange(
  startsAt: string,
  endsAt: string,
) {
  return isValidBusinessStartIso(startsAt) && isValidBusinessEndIso(endsAt)
}

export function zonedFromIso(iso: string) {
  return Temporal.Instant.from(iso).toZonedDateTimeISO(ROOM_TIME_ZONE)
}

export function toScheduleDateTimeString(iso: string) {
  const zoned = zonedFromIso(iso)
  return `${zoned.toPlainDate().toString()} ${pad(zoned.hour)}:${pad(
    zoned.minute,
  )}`
}

export function toDateInputValue(iso: string) {
  return zonedFromIso(iso).toPlainDate().toString()
}

export function toTimeInputValue(iso: string) {
  const zoned = zonedFromIso(iso)
  return `${pad(zoned.hour)}:${pad(zoned.minute)}`
}

export function localFieldsToIso(date: string, time: string) {
  return Temporal.ZonedDateTime.from(`${date}T${time}:00[${ROOM_TIME_ZONE}]`)
    .toInstant()
    .toString()
}

export function roundUpToNextQuarter(date = new Date()) {
  const rounded = new Date(date)
  rounded.setSeconds(0, 0)
  const remainder = rounded.getMinutes() % 15

  if (remainder !== 0) {
    rounded.setMinutes(rounded.getMinutes() + (15 - remainder))
  }

  return rounded
}

export function defaultReservationFormValues(date = roundUpToNextQuarter()) {
  let start = Temporal.Instant.from(date.toISOString()).toZonedDateTimeISO(
    ROOM_TIME_ZONE,
  )
  let end = start.add({ hours: 1 })

  if (
    Temporal.PlainDate.compare(start.toPlainDate(), end.toPlainDate()) !== 0 ||
    !isValidBusinessStartTime(`${pad(start.hour)}:${pad(start.minute)}`) ||
    !isValidBusinessEndTime(`${pad(end.hour)}:${pad(end.minute)}`)
  ) {
    start = start
      .toPlainDate()
      .add({ days: 1 })
      .toZonedDateTime({
        timeZone: ROOM_TIME_ZONE,
        plainTime: Temporal.PlainTime.from('08:00'),
      })
    end = start.add({ hours: 1 })
  }

  return {
    title: '',
    date: start.toPlainDate().toString(),
    startsAt: `${pad(start.hour)}:${pad(start.minute)}`,
    endsAt: `${pad(end.hour)}:${pad(end.minute)}`,
    needsPrivacy: false,
    notes: '',
  }
}

export function reservationToFormValues(
  reservation: ReservationDTO,
): ReservationFormValues {
  return {
    title: reservation.title,
    date: toDateInputValue(reservation.startsAt),
    startsAt: toTimeInputValue(reservation.startsAt),
    endsAt: toTimeInputValue(reservation.endsAt),
    needsPrivacy: reservation.needsPrivacy,
    notes: reservation.notes ?? '',
  }
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ROOM_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: ROOM_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatDateTimeRange(startsAt: string, endsAt: string) {
  return `${formatDate(startsAt)} - ${formatTime(startsAt)} - ${formatTime(
    endsAt,
  )}`
}

export function validateReservationForm(values: ReservationFormValues) {
  if (!values.title.trim()) {
    return 'Informe o titulo da reserva.'
  }

  if (values.title.trim().length > 120) {
    return 'O titulo deve ter no maximo 120 caracteres.'
  }

  const startIso = localFieldsToIso(values.date, values.startsAt)
  const endIso = localFieldsToIso(values.date, values.endsAt)
  const start = new Date(startIso)
  const end = new Date(endIso)

  if (start >= end) {
    return 'O inicio deve ser anterior ao termino.'
  }

  if (end.getTime() - start.getTime() < MIN_RESERVATION_MINUTES * 60 * 1000) {
    return 'A duracao minima e de 15 minutos.'
  }

  if (
    !isValidBusinessStartTime(values.startsAt) ||
    !isValidBusinessEndTime(values.endsAt)
  ) {
    return BUSINESS_HOURS_ERROR
  }

  if (start < new Date()) {
    return 'Nao e possivel criar uma reserva no passado.'
  }

  return null
}
