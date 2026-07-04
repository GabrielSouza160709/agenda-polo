import { AppShell, type AppUser } from '@/components/app-shell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getActiveUser } from '@/lib/server-auth'
import type { GetServerSideProps } from 'next'

interface WeekdayCount {
  label: string
  count: number
}

interface HourCount {
  hour: number
  count: number
}

interface UserUsage {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  total: number
  thisMonth: number
  lastReservation: string | null
}

interface MetricsProps {
  currentUser: AppUser & { id: string; role: 'USER' | 'ADMIN' }
  total: number
  totalThisMonth: number
  totalLastMonth: number
  cancellationRate: number
  peakWeekday: string
  peakHour: number
  mostActiveMonthUser: { name: string; count: number } | null
  weekdayCounts: WeekdayCount[]
  hourCounts: HourCount[]
  usageByUser: UserUsage[]
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {sub ? (
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  )
}

function BarChart({
  data,
  labelKey,
  countKey,
  formatLabel,
}: {
  data: { label?: string; hour?: number; count: number }[]
  labelKey: 'label' | 'hour'
  countKey: 'count'
  formatLabel?: (val: string | number) => string
}) {
  const max = Math.max(...data.map((d) => d[countKey]), 1)

  return (
    <div className="flex h-40 items-end gap-1">
      {data.map((d, i) => {
        const rawLabel = d[labelKey]
        const displayLabel =
          formatLabel && rawLabel !== undefined
            ? formatLabel(rawLabel as string | number)
            : String(rawLabel ?? '')
        const pct = Math.round(((d[countKey] ?? 0) / max) * 100)

        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center gap-1"
          >
            <div className="relative flex w-full flex-col items-center justify-end" style={{ height: '120px' }}>
              {d[countKey] > 0 ? (
                <div
                  className="w-full rounded-t-sm bg-primary transition-all"
                  style={{ height: `${pct}%`, minHeight: '4px' }}
                  title={`${displayLabel}: ${d[countKey]}`}
                />
              ) : (
                <div className="w-full rounded-t-sm bg-border" style={{ height: '4px' }} />
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">{displayLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminMetricas({
  currentUser,
  total,
  totalThisMonth,
  totalLastMonth,
  cancellationRate,
  peakWeekday,
  peakHour,
  mostActiveMonthUser,
  weekdayCounts,
  hourCounts,
  usageByUser,
}: MetricsProps) {
  const monthDiff = totalThisMonth - totalLastMonth
  const monthDiffLabel =
    monthDiff === 0
      ? 'igual ao mês anterior'
      : monthDiff > 0
        ? `+${monthDiff} vs mês anterior`
        : `${monthDiff} vs mês anterior`

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-foreground">
            Métricas de Uso
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do uso da sala de reunião.
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de reservas"
            value={String(total)}
            sub="todos os tempos"
          />
          <StatCard
            label="Reservas este mês"
            value={String(totalThisMonth)}
            sub={monthDiffLabel}
          />
          <StatCard
            label="Taxa de cancelamento"
            value={`${cancellationRate}%`}
            sub="do total de reservas"
          />
          <StatCard
            label="Mais ativo este mês"
            value={mostActiveMonthUser?.name ?? '—'}
            sub={
              mostActiveMonthUser
                ? `${mostActiveMonthUser.count} reserva${mostActiveMonthUser.count !== 1 ? 's' : ''}`
                : 'sem dados'
            }
          />
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Reservas por dia da semana
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Dia de pico: <strong className="text-foreground">{peakWeekday}</strong>
            </p>
            <BarChart
              data={weekdayCounts}
              labelKey="label"
              countKey="count"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Horário de pico (06h–20h)
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Horário mais reservado:{' '}
              <strong className="text-foreground">
                {String(peakHour).padStart(2, '0')}h
              </strong>
            </p>
            <BarChart
              data={hourCounts}
              labelKey="hour"
              countKey="count"
              formatLabel={(h) => `${String(h).padStart(2, '0')}h`}
            />
          </div>
        </div>

        {/* Tabela de uso por usuário */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Uso por usuário
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Este mês
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Última reserva
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usageByUser.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0 bg-[var(--brand-subtle)] text-[var(--brand-text)]">
                          <AvatarImage
                            src={u.avatar_url ?? undefined}
                            alt={u.name}
                          />
                          <AvatarFallback className="text-xs">
                            {initials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {u.total}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {u.thisMonth}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.lastReservation ? formatDate(u.lastReservation) : '—'}
                    </td>
                  </tr>
                ))}
                {usageByUser.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Nenhuma reserva registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-[var(--text-muted)] md:hidden">
          Desenvolvido por Gabriel Souza
        </p>
      </div>
    </AppShell>
  )
}

export const getServerSideProps: GetServerSideProps<MetricsProps> = async ({
  req,
  res,
}) => {
  const activeUser = await getActiveUser(req, res)

  if (!activeUser.user || activeUser.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/agenda',
        permanent: false,
      },
    }
  }

  const { prisma } = await import('@/lib/prisma')

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  )

  const [
    allReservations,
    totalThisMonth,
    totalLastMonth,
    reservationsByUser,
    mostActiveThisMonth,
  ] = await Promise.all([
    prisma.reservation.findMany({
      select: { startsAt: true, status: true, createdById: true },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: startOfThisMonth } },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.reservation.groupBy({
      by: ['createdById'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.reservation.groupBy({
      by: ['createdById'],
      where: { createdAt: { gte: startOfThisMonth } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
  ])

  const total = allReservations.length
  const cancelled = allReservations.filter(
    (r) => r.status === 'CANCELLED',
  ).length
  const cancellationRate =
    total > 0 ? Math.round((cancelled / total) * 100) : 0

  const weekdayCounts: number[] = Array(7).fill(0)
  const hourCounts: number[] = Array(24).fill(0)
  for (const r of allReservations) {
    if (r.status === 'CONFIRMED') {
      weekdayCounts[new Date(r.startsAt).getDay()]++
      hourCounts[new Date(r.startsAt).getHours()]++
    }
  }

  const userIds = reservationsByUser.map((g) => g.createdById)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true,
      reservations: {
        where: { createdAt: { gte: startOfThisMonth } },
        select: { id: true },
      },
    },
  })

  const lastReservationByUser = await prisma.reservation.findMany({
    where: { createdById: { in: userIds } },
    orderBy: { startsAt: 'desc' },
    distinct: ['createdById'],
    select: { createdById: true, startsAt: true },
  })
  const lastReservationMap = Object.fromEntries(
    lastReservationByUser.map((r) => [r.createdById, r.startsAt.toISOString()]),
  )
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const usageByUser = reservationsByUser.map((g) => {
    const u = userMap[g.createdById]
    return {
      id: g.createdById,
      name: u?.name ?? 'Desconhecido',
      email: u?.email ?? null,
      avatar_url: u?.avatar_url ?? null,
      total: g._count.id,
      thisMonth: u?.reservations.length ?? 0,
      lastReservation: lastReservationMap[g.createdById] ?? null,
    }
  })

  let mostActiveMonthUser: { name: string; count: number } | null = null
  if (mostActiveThisMonth.length > 0) {
    const topId = mostActiveThisMonth[0].createdById
    const topUser = userMap[topId]
    mostActiveMonthUser = {
      name: topUser?.name ?? 'Desconhecido',
      count: mostActiveThisMonth[0]._count.id,
    }
  }

  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const peakWeekdayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts))

  return {
    props: {
      currentUser: {
        id: activeUser.user.id,
        name: activeUser.user.name,
        email: activeUser.user.email ?? '',
        image: activeUser.user.avatar_url,
        role: activeUser.user.role,
      },
      total,
      totalThisMonth,
      totalLastMonth,
      cancellationRate,
      peakWeekday: weekdayLabels[peakWeekdayIndex] ?? '—',
      peakHour: hourCounts.indexOf(Math.max(...hourCounts)),
      mostActiveMonthUser,
      weekdayCounts: weekdayLabels.map((label, i) => ({
        label,
        count: weekdayCounts[i] ?? 0,
      })),
      hourCounts: Array.from({ length: 15 }, (_, i) => ({
        hour: i + 6,
        count: hourCounts[i + 6] ?? 0,
      })),
      usageByUser,
    },
  }
}
