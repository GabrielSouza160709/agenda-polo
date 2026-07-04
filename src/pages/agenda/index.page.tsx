import { AppShell, type AppUser } from '@/components/app-shell'
import { CalendarToolbar } from '@/components/calendar/calendar-toolbar'
import {
  ReservationDialog,
  type ReservationDialogResult,
  type ReservationDialogState,
} from '@/components/reservation-dialog'
import { RoomStatus } from '@/components/room-status'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  ROOM_TIME_ZONE,
  type ReservationDTO,
  type ReservationFormValues,
  defaultReservationFormValues,
} from '@/lib/reservation-client'
import { getActiveUser } from '@/lib/server-auth'
import {
  type CalendarApp,
  type CalendarEvent,
  createCalendar,
  viewDay,
  viewMonthGrid,
  viewWeek,
} from '@schedule-x/calendar'
import { createCurrentTimePlugin } from '@schedule-x/current-time'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { Plus } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Temporal } from 'temporal-polyfill'

const ScheduleXCalendar = dynamic(
  () => import('@schedule-x/react').then((mod) => mod.ScheduleXCalendar),
  { ssr: false },
)

interface AgendaProps {
  user: AppUser
}

interface TimeBoundaryLabelPosition {
  top: number
  bottom: number
  left: number
}

function formatTimePart(dateTime: Temporal.ZonedDateTime) {
  return `${String(dateTime.hour).padStart(2, '0')}:${String(
    dateTime.minute,
  ).padStart(2, '0')}`
}

function rangeDateToIso(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toInstant' in value &&
    typeof value.toInstant === 'function'
  ) {
    return value.toInstant().toString()
  }

  return Temporal.PlainDate.from(value as string)
    .toZonedDateTime(ROOM_TIME_ZONE)
    .toInstant()
    .toString()
}

function toCalendarEvent(reservation: ReservationDTO): CalendarEvent {
  const start = Temporal.Instant.from(reservation.startsAt).toZonedDateTimeISO(
    ROOM_TIME_ZONE,
  )
  const end = Temporal.Instant.from(reservation.endsAt).toZonedDateTimeISO(
    ROOM_TIME_ZONE,
  )

  return {
    id: reservation.id,
    title: `${reservation.needsPrivacy ? 'Privada - ' : ''}${
      reservation.title
    }`,
    start,
    end,
    calendarId: reservation.needsPrivacy ? 'privacy' : 'normal',
    people: [reservation.creator.name],
    description: reservation.notes ?? undefined,
    reservation,
  }
}

function CalendarSkeleton() {
  return (
    <div
      className="grid h-full min-h-[620px] gap-3 bg-card p-4 md:min-h-[680px]"
      aria-busy="true"
      aria-label="Carregando reservas"
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-[56px_1fr] gap-3">
        <div className="grid gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-8 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-8 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function todayRangeIso() {
  const today = Temporal.Now.plainDateISO(ROOM_TIME_ZONE)
  const start = today.toZonedDateTime(ROOM_TIME_ZONE).toInstant().toString()
  const end = today
    .add({ days: 1 })
    .toZonedDateTime(ROOM_TIME_ZONE)
    .toInstant()
    .toString()

  return { start, end }
}

function scrollCalendarToCurrentTime() {
  const indicator = document.querySelector('.sx__current-time-indicator')

  if (indicator) {
    indicator.scrollIntoView({ block: 'center', inline: 'nearest' })
    return
  }

  const scroller = document.querySelector<HTMLElement>(
    '.sx__week-grid, .sx__day-grid, .sx__time-grid',
  )

  if (!scroller) {
    return
  }

  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const businessStart = 6 * 60
  const businessEnd = 20 * 60
  const clampedMinutes = Math.min(businessEnd, Math.max(businessStart, minutes))
  scroller.scrollTop =
    (scroller.scrollHeight - scroller.clientHeight) *
    ((clampedMinutes - businessStart) / (businessEnd - businessStart))
}

function formValuesFromDateTime(
  dateTime: Temporal.ZonedDateTime,
): ReservationFormValues {
  const end = dateTime.add({ hours: 1 })

  return {
    title: '',
    date: dateTime.toPlainDate().toString(),
    startsAt: formatTimePart(dateTime),
    endsAt:
      end.toPlainDate().toString() === dateTime.toPlainDate().toString()
        ? formatTimePart(end)
        : '23:59',
    needsPrivacy: false,
    notes: '',
  }
}

function shouldIgnoreShortcut(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return true
  }

  const target = event.target

  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export default function Agenda({ user }: AgendaProps) {
  const [calendarApp, setCalendarApp] = useState<CalendarApp | null>(null)
  const [statusReservations, setStatusReservations] = useState<
    ReservationDTO[]
  >([])
  const [todayReservationsCount, setTodayReservationsCount] = useState(0)
  const [visibleReservationCount, setVisibleReservationCount] = useState(0)
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [dialogState, setDialogState] = useState<ReservationDialogState | null>(
    null,
  )
  const eventsServiceRef = useRef<ReturnType<
    typeof createEventsServicePlugin
  > | null>(null)
  const lastRangeRef = useRef<{ start: string; end: string } | null>(null)
  const calendarFrameRef = useRef<HTMLDivElement | null>(null)
  const [boundaryLabelPosition, setBoundaryLabelPosition] =
    useState<TimeBoundaryLabelPosition | null>(null)

  const openNewReservation = useCallback(() => {
    setDialogState({
      type: 'create',
      defaults: defaultReservationFormValues(),
    })
  }, [])

  const loadReservations = useCallback(async (start: string, end: string) => {
    setCalendarLoading(true)

    try {
      const response = await fetch(
        `/api/reservations?start=${encodeURIComponent(
          start,
        )}&end=${encodeURIComponent(end)}`,
      )

      if (!response.ok) {
        throw new Error('Nao foi possivel carregar as reservas.')
      }

      const payload = (await response.json()) as {
        reservations: ReservationDTO[]
      }
      setVisibleReservationCount(payload.reservations.length)
      return payload.reservations.map(toCalendarEvent)
    } finally {
      setCalendarLoading(false)
    }
  }, [])

  const refreshStatus = useCallback(async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 60_000).toISOString()
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const todayRange = todayRangeIso()

    const [statusResponse, todayResponse] = await Promise.all([
      fetch(
        `/api/reservations?start=${encodeURIComponent(
          start,
        )}&end=${encodeURIComponent(end)}`,
      ),
      fetch(
        `/api/reservations?start=${encodeURIComponent(
          todayRange.start,
        )}&end=${encodeURIComponent(todayRange.end)}`,
      ),
    ])

    if (statusResponse.ok) {
      const payload = (await statusResponse.json()) as {
        reservations: ReservationDTO[]
      }
      setStatusReservations(payload.reservations)
    }

    if (todayResponse.ok) {
      const payload = (await todayResponse.json()) as {
        reservations: ReservationDTO[]
      }
      setTodayReservationsCount(payload.reservations.length)
    }
  }, [])

  const refreshVisibleRange = useCallback(async () => {
    if (lastRangeRef.current && eventsServiceRef.current) {
      const events = await loadReservations(
        lastRangeRef.current.start,
        lastRangeRef.current.end,
      )
      eventsServiceRef.current.set(events)
    }

    await refreshStatus()
  }, [loadReservations, refreshStatus])

  const handleDialogSuccess = useCallback(
    async (result: ReservationDialogResult) => {
      const eventsService = eventsServiceRef.current

      if (eventsService) {
        if (result.action === 'create') {
          eventsService.add(toCalendarEvent(result.reservation))
          setVisibleReservationCount((current) => current + 1)
        }

        if (result.action === 'edit') {
          eventsService.update(toCalendarEvent(result.reservation))
        }

        if (result.action === 'cancel') {
          eventsService.remove(result.reservation.id)
          setVisibleReservationCount((current) => Math.max(0, current - 1))
        }
      } else {
        await refreshVisibleRange()
      }

      await refreshStatus()
    },
    [refreshStatus, refreshVisibleRange],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'n' || shouldIgnoreShortcut(event)) {
        return
      }

      event.preventDefault()
      openNewReservation()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openNewReservation])

  useEffect(() => {
    const eventsService = createEventsServicePlugin()
    const currentTimePlugin = createCurrentTimePlugin({ fullWeekWidth: true })
    eventsServiceRef.current = eventsService
    const isMobile = window.matchMedia('(max-width: 767px)').matches

    const app = createCalendar(
      {
        views: [viewDay, viewWeek, viewMonthGrid],
        defaultView: isMobile ? viewDay.name : viewWeek.name,
        locale: 'pt-BR',
        timezone: ROOM_TIME_ZONE,
        dayBoundaries: {
          start: '06:00',
          end: '20:00',
        },
        isDark: document.documentElement.classList.contains('dark'),
        calendars: {
          normal: {
            colorName: 'normal',
            label: 'Aberta',
            lightColors: {
              main: '#F97316',
              container: '#FFF7ED',
              onContainer: '#9A3412',
            },
            darkColors: {
              main: '#F97316',
              container: '#1C1208',
              onContainer: '#FB923C',
            },
          },
          privacy: {
            colorName: 'privacy',
            label: 'Privada',
            lightColors: {
              main: '#3B82F6',
              container: '#EFF6FF',
              onContainer: '#1E3A8A',
            },
            darkColors: {
              main: '#60A5FA',
              container: '#0C1A3A',
              onContainer: '#93C5FD',
            },
          },
        },
        callbacks: {
          async fetchEvents(range) {
            const start = rangeDateToIso(range.start)
            const end = rangeDateToIso(range.end)
            lastRangeRef.current = { start, end }
            return loadReservations(start, end)
          },
          onRangeUpdate(range) {
            lastRangeRef.current = {
              start: rangeDateToIso(range.start),
              end: rangeDateToIso(range.end),
            }
          },
          onDoubleClickDateTime(dateTime) {
            setDialogState({
              type: 'create',
              defaults: formValuesFromDateTime(dateTime),
            })
          },
          onEventClick(event) {
            const reservation = event.reservation as ReservationDTO | undefined
            if (reservation) {
              setDialogState({ type: 'details', reservation })
            }
          },
        },
      },
      [eventsService, currentTimePlugin],
    )

    function handleThemeChange(event: Event) {
      const theme = (event as CustomEvent<'light' | 'dark'>).detail
      app.setTheme(theme)
    }

    setCalendarApp(app)
    refreshStatus()
    const scrollTimeout = window.setTimeout(scrollCalendarToCurrentTime, 700)
    const interval = window.setInterval(refreshStatus, 60_000)
    window.addEventListener('polo-theme-change', handleThemeChange)

    return () => {
      window.clearTimeout(scrollTimeout)
      window.clearInterval(interval)
      window.removeEventListener('polo-theme-change', handleThemeChange)
      app.destroy()
      eventsServiceRef.current = null
    }
  }, [loadReservations, refreshStatus])

  useEffect(() => {
    if (!calendarApp) {
      setBoundaryLabelPosition(null)
      return
    }

    const frame = calendarFrameRef.current

    if (!frame) {
      return
    }

    function updateBoundaryLabels() {
      const currentFrame = calendarFrameRef.current
      const timeGrid = currentFrame?.querySelector<HTMLElement>(
        '.sx__week-grid, .sx__day-grid, .sx__time-grid',
      )
      const firstHourText = currentFrame?.querySelector<HTMLElement>(
        '.sx__week-grid__time-axis .sx__week-grid__hour-text',
      )
      const timeAxis = currentFrame?.querySelector<HTMLElement>(
        '.sx__week-grid__time-axis',
      )

      if (!currentFrame || !timeGrid || (!firstHourText && !timeAxis)) {
        setBoundaryLabelPosition(null)
        return
      }

      const labelAnchor = firstHourText ?? timeAxis

      if (!labelAnchor) {
        setBoundaryLabelPosition(null)
        return
      }

      const frameRect = currentFrame.getBoundingClientRect()
      const gridRect = timeGrid.getBoundingClientRect()
      const anchorRect = labelAnchor.getBoundingClientRect()

      setBoundaryLabelPosition({
        top: gridRect.top - frameRect.top,
        bottom: gridRect.bottom - frameRect.top,
        left: anchorRect.left - frameRect.left,
      })
    }

    const resizeObserver = new ResizeObserver(updateBoundaryLabels)
    resizeObserver.observe(frame)
    const mutationObserver = new MutationObserver(updateBoundaryLabels)
    mutationObserver.observe(frame, { childList: true, subtree: true })
    const firstMeasureTimeout = window.setTimeout(updateBoundaryLabels, 100)
    const settledMeasureTimeout = window.setTimeout(updateBoundaryLabels, 700)
    window.addEventListener('resize', updateBoundaryLabels)

    updateBoundaryLabels()

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.clearTimeout(firstMeasureTimeout)
      window.clearTimeout(settledMeasureTimeout)
      window.removeEventListener('resize', updateBoundaryLabels)
    }
  }, [calendarApp])

  return (
    <AppShell user={user} onNewReservation={openNewReservation}>
      <div className="flex min-h-dvh flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-normal text-foreground">
              Agenda da Sala
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualize, crie e ajuste reservas da sala de reuniao.
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <ThemeToggle />
            <Button
              type="button"
              className="hidden md:inline-flex"
              onClick={openNewReservation}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Nova Reserva</span>
              <span className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground md:inline-flex">
                N
              </span>
            </Button>
          </div>
        </div>

        <RoomStatus
          reservations={statusReservations}
          todayReservationsCount={todayReservationsCount}
        />

        <div
          ref={calendarFrameRef}
          className="relative min-h-[620px] flex-1 rounded-lg border border-border bg-card shadow-[var(--shadow-sm)] md:min-h-[680px]"
        >
          {calendarApp ? (
            <div className="flex h-full min-h-[620px] flex-col md:min-h-[680px]">
              <CalendarToolbar calendarApp={calendarApp} />
              <div className="min-h-0 flex-1">
                <ScheduleXCalendar calendarApp={calendarApp} />
              </div>
            </div>
          ) : (
            <CalendarSkeleton />
          )}
          {calendarApp && boundaryLabelPosition ? (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute z-10 -translate-y-1/2 text-[12px] leading-none text-[var(--text-muted)]"
                style={{
                  left: boundaryLabelPosition.left,
                  top: boundaryLabelPosition.top,
                }}
              >
                06
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute z-10 -translate-y-1/2 text-[12px] leading-none text-[var(--text-muted)]"
                style={{
                  left: boundaryLabelPosition.left,
                  top: boundaryLabelPosition.bottom,
                }}
              >
                20
              </span>
            </>
          ) : null}
          {calendarApp && calendarLoading ? (
            <div className="absolute inset-0 bg-card/90">
              <CalendarSkeleton />
            </div>
          ) : null}
        </div>

        {!calendarLoading && visibleReservationCount === 0 ? (
          <p className="text-center text-[13px] text-[var(--text-muted)]">
            Nenhuma reserva esta semana. Clique em + Nova Reserva ou pressione N
            para criar.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="fixed bottom-[calc(64px+16px+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-md)] transition duration-150 ease-out hover:bg-[var(--brand-hover)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
        onClick={openNewReservation}
        aria-label="Nova reserva"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      <ReservationDialog
        state={dialogState}
        onChangeState={setDialogState}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState(null)
          }
        }}
        onSuccess={handleDialogSuccess}
      />
    </AppShell>
  )
}

export const getServerSideProps: GetServerSideProps<AgendaProps> = async ({
  req,
  res,
}) => {
  const activeUser = await getActiveUser(req, res)

  if (!activeUser.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: {
        name: activeUser.user.name,
        email: activeUser.user.email ?? '',
        image: activeUser.user.avatar_url,
        role: activeUser.user.role,
      },
    },
  }
}
