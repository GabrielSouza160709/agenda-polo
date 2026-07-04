import { type ReservationDTO, formatTime } from '@/lib/reservation-client'
import { CalendarClock, DoorOpen, Lock } from 'lucide-react'

interface RoomStatusProps {
  reservations: ReservationDTO[]
  todayReservationsCount: number
}

function StatusPulse({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'relative mt-1 flex h-3 w-3 shrink-0 text-destructive'
          : 'relative mt-1 flex h-3 w-3 shrink-0 text-[var(--success)]'
      }
      aria-hidden="true"
    >
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
        style={{ backgroundColor: 'currentColor' }}
      />
      <span
        className="relative inline-flex h-3 w-3 rounded-full"
        style={{ backgroundColor: 'currentColor' }}
      />
    </span>
  )
}

function ReservationColorLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full bg-[#F97316]"
          aria-hidden="true"
        />
        <span className="text-[11px] leading-none text-[var(--text-muted)]">
          Aberta
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full bg-[#3B82F6]"
          aria-hidden="true"
        />
        <span className="text-[11px] leading-none text-[var(--text-muted)]">
          Privada
        </span>
      </span>
    </div>
  )
}

export function RoomStatus({
  reservations,
  todayReservationsCount,
}: RoomStatusProps) {
  const now = new Date()
  const confirmed = reservations
    .filter((reservation) => reservation.status === 'CONFIRMED')
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    )

  const active = confirmed.find(
    (reservation) =>
      new Date(reservation.startsAt) <= now &&
      new Date(reservation.endsAt) > now,
  )
  const next = confirmed.find(
    (reservation) => new Date(reservation.startsAt) > now,
  )

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow-sm)] sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <StatusPulse active={Boolean(active)} />
        <div className="grid min-w-0 gap-1">
          <div className="flex items-center gap-2">
            {active ? (
              <Lock className="h-4 w-4 text-destructive" aria-hidden="true" />
            ) : (
              <DoorOpen
                className="h-4 w-4 text-[var(--success)]"
                aria-hidden="true"
              />
            )}
            <h2 className="text-[15px] font-semibold leading-tight text-foreground">
              {active
                ? `Sala ocupada ate ${formatTime(active.endsAt)}`
                : 'Sala livre agora'}
            </h2>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {active
              ? active.needsPrivacy
                ? 'Reserva privada em andamento'
                : active.creator.name
              : 'A sala esta disponivel para uso'}
          </p>
          <ReservationColorLegend />
          <p className="text-xs text-[var(--text-muted)]">
            {todayReservationsCount === 1
              ? '1 reserva hoje'
              : `${todayReservationsCount} reservas hoje`}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-md bg-muted px-3 py-2 text-[13px] text-muted-foreground sm:text-right">
        {next ? (
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Proxima: {formatTime(next.startsAt)} - {formatTime(next.endsAt)}
              {next.needsPrivacy ? '' : `, ${next.creator.name}`}
            </span>
          </span>
        ) : (
          'Sem proximas reservas'
        )}
      </div>
    </section>
  )
}
