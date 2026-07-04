import { prisma } from '@/lib/prisma'
import { getActiveUser } from '@/lib/server-auth'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  const activeUser = await getActiveUser(req, res)

  if (!activeUser.user) {
    return res.status(activeUser.status).json({
      message:
        activeUser.status === 401 ? 'Não autenticado.' : 'Usuário sem permissão.',
    })
  }

  if (activeUser.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito a administradores.' })
  }

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const [
    allReservations,
    totalThisMonth,
    totalLastMonth,
    reservationsByUser,
    mostActiveThisMonth,
  ] = await Promise.all([
    prisma.reservation.findMany({
      select: {
        startsAt: true,
        status: true,
        createdById: true,
      },
    }),
    prisma.reservation.count({
      where: { createdAt: { gte: startOfThisMonth } },
    }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
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
  const cancelled = allReservations.filter((r) => r.status === 'CANCELLED').length
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

  // Reservas por dia da semana (0=dom, 1=seg, ..., 6=sab) — contar apenas CONFIRMED
  const weekdayCounts: number[] = Array(7).fill(0)
  for (const r of allReservations) {
    if (r.status === 'CONFIRMED') {
      weekdayCounts[new Date(r.startsAt).getDay()]++
    }
  }

  // Horário de pico por hora (06–20) — contar apenas CONFIRMED
  const hourCounts: number[] = Array(24).fill(0)
  for (const r of allReservations) {
    if (r.status === 'CONFIRMED') {
      hourCounts[new Date(r.startsAt).getHours()]++
    }
  }

  // Enriquece reservationsByUser com dados do usuário
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

  // Última reserva por usuário
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

  // Usuário mais ativo do mês
  let mostActiveMonthUser: { name: string; count: number } | null = null
  if (mostActiveThisMonth.length > 0) {
    const topId = mostActiveThisMonth[0].createdById
    const topUser = userMap[topId]
    mostActiveMonthUser = {
      name: topUser?.name ?? 'Desconhecido',
      count: mostActiveThisMonth[0]._count.id,
    }
  }

  // Dia da semana com mais reservas (label pt-BR)
  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const peakWeekdayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts))

  return res.status(200).json({
    total,
    totalThisMonth,
    totalLastMonth,
    cancellationRate,
    peakWeekday: weekdayLabels[peakWeekdayIndex],
    peakHour: hourCounts.indexOf(Math.max(...hourCounts)),
    mostActiveMonthUser,
    weekdayCounts: weekdayLabels.map((label, i) => ({
      label,
      count: weekdayCounts[i],
    })),
    hourCounts: Array.from({ length: 15 }, (_, i) => ({
      hour: i + 6,
      count: hourCounts[i + 6],
    })),
    usageByUser,
  })
}
