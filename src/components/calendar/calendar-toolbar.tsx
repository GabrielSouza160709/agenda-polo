import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type CalendarApp,
  viewDay,
  viewMonthGrid,
  viewWeek,
} from '@schedule-x/calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Temporal } from 'temporal-polyfill'

interface CalendarToolbarProps {
  calendarApp: CalendarApp
}

interface ToolbarSnapshot {
  selectedDate: string
  title: string
  view: string
}

const viewOptions = [
  { label: 'Semana', value: viewWeek.name },
  { label: 'Dia', value: viewDay.name },
  { label: 'Mes', value: viewMonthGrid.name },
]

function toPlainDate(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'toPlainDate' in value &&
    typeof value.toPlainDate === 'function'
  ) {
    return value.toPlainDate() as Temporal.PlainDate
  }

  return Temporal.PlainDate.from(value as string)
}

function getCalendarInternals(calendarApp: CalendarApp) {
  return (calendarApp as unknown as { $app: any }).$app
}

function formatMonthYear(date: Temporal.PlainDate, locale: string) {
  return date.toLocaleString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

function formatRangeTitle(calendarApp: CalendarApp) {
  const $app = getCalendarInternals(calendarApp)
  const locale = $app.config.locale.value as string
  const range = $app.calendarState.range.value
  const selectedDate = $app.datePickerState.selectedDate.value as Temporal.PlainDate

  if (!range?.start || !range?.end) {
    return formatMonthYear(selectedDate, locale)
  }

  const start = toPlainDate(range.start)
  const end = toPlainDate(range.end)

  if (start.year === end.year && start.month === end.month) {
    return formatMonthYear(start, locale)
  }

  const startMonth = start.toLocaleString(locale, { month: 'long' })
  const endMonthYear = formatMonthYear(end, locale)

  return `${startMonth} - ${endMonthYear}`
}

function readSnapshot(calendarApp: CalendarApp): ToolbarSnapshot {
  const $app = getCalendarInternals(calendarApp)
  const selectedDate = $app.datePickerState.selectedDate.value as Temporal.PlainDate

  return {
    selectedDate: selectedDate.toString(),
    title: formatRangeTitle(calendarApp),
    view: $app.calendarState.view.value as string,
  }
}

function useToolbarSnapshot(calendarApp: CalendarApp) {
  const [snapshot, setSnapshot] = useState(() => readSnapshot(calendarApp))

  useEffect(() => {
    setSnapshot(readSnapshot(calendarApp))

    const interval = window.setInterval(() => {
      setSnapshot(readSnapshot(calendarApp))
    }, 250)

    return () => window.clearInterval(interval)
  }, [calendarApp])

  return snapshot
}

function navigateToDate(calendarApp: CalendarApp, date: Temporal.PlainDate) {
  const $app = getCalendarInternals(calendarApp)
  const currentView = $app.calendarState.view.value as string

  $app.datePickerState.selectedDate.value = date
  $app.calendarState.setView(currentView, date)
}

function navigateToToday(calendarApp: CalendarApp) {
  const $app = getCalendarInternals(calendarApp)
  const timezone = $app.config.timezone.value as string

  navigateToDate(calendarApp, Temporal.Now.plainDateISO(timezone))
}

function navigatePeriod(calendarApp: CalendarApp, direction: -1 | 1) {
  const $app = getCalendarInternals(calendarApp)
  const currentView = $app.config.views.value.find(
    (view: { name: string }) => view.name === $app.calendarState.view.value,
  )

  if (!currentView) {
    return
  }

  const result = currentView.backwardForwardFn(
    $app.datePickerState.selectedDate.value,
    direction * currentView.backwardForwardUnits,
  )
  const nextDate = toPlainDate(result)

  navigateToDate(calendarApp, nextDate)
}

function setView(calendarApp: CalendarApp, view: string) {
  const $app = getCalendarInternals(calendarApp)
  const selectedDate = $app.datePickerState
    .selectedDate.value as Temporal.PlainDate

  $app.calendarState.setView(view, selectedDate)
}

export function CalendarToolbar({ calendarApp }: CalendarToolbarProps) {
  const snapshot = useToolbarSnapshot(calendarApp)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-3 py-3 text-card-foreground sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-md px-4 text-sm font-medium"
          onClick={() => navigateToToday(calendarApp)}
        >
          Hoje
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => navigatePeriod(calendarApp, -1)}
            aria-label="Periodo anterior"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => navigatePeriod(calendarApp, 1)}
            aria-label="Proximo periodo"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <h2 className="min-w-0 text-base font-medium leading-tight text-foreground">
          {snapshot.title}
        </h2>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="grid gap-1 text-[11px] font-medium leading-none text-[var(--text-muted)]">
          Visualizacao
          <select
            className={cn(
              'h-10 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] outline-none transition focus-visible:ring-2 focus-visible:ring-ring',
            )}
            value={snapshot.view}
            onChange={(event) => setView(calendarApp, event.target.value)}
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-[11px] font-medium leading-none text-[var(--text-muted)]">
          Data
          <input
            className="h-10 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            type="date"
            value={snapshot.selectedDate}
            onChange={(event) => {
              if (event.target.value) {
                navigateToDate(
                  calendarApp,
                  Temporal.PlainDate.from(event.target.value),
                )
              }
            }}
          />
        </label>
      </div>
    </div>
  )
}
