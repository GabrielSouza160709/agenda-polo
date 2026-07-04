import { prisma } from '@/lib/prisma'
import { getActiveUser } from '@/lib/server-auth'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const patchBodySchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
})

const deleteBodySchema = z.object({
  userId: z.string().min(1),
})

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        role: true,
        isActive: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    })

    return res.status(200).json({ users })
  }

  if (req.method === 'PATCH') {
    const parsed = patchBodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const { userId, role, isActive } = parsed.data

    if (userId === activeUser.user.id) {
      return res.status(403).json({ message: 'Você não pode alterar sua própria conta.' })
    }

    if (role === undefined && isActive === undefined) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar.' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        role: true,
        isActive: true,
        created_at: true,
      },
    })

    return res.status(200).json({ user: updated })
  }

  if (req.method === 'DELETE') {
    const parsed = deleteBodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Dados inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const { userId } = parsed.data

    if (userId === activeUser.user.id) {
      return res.status(403).json({ message: 'Você não pode remover sua própria conta.' })
    }

    const futureReservations = await prisma.reservation.count({
      where: {
        createdById: userId,
        status: 'CONFIRMED',
        startsAt: { gt: new Date() },
      },
    })

    if (futureReservations > 0) {
      return res.status(409).json({
        message: 'Usuário tem reservas futuras. Cancele-as antes de remover.',
      })
    }

    const userReservationIds = (
      await prisma.reservation.findMany({
        where: { createdById: userId },
        select: { id: true },
      })
    ).map((r) => r.id)

    await prisma.$transaction([
      prisma.notificationLog.deleteMany({
        where: { reservationId: { in: userReservationIds } },
      }),
      prisma.reservation.deleteMany({ where: { createdById: userId } }),
      prisma.session.deleteMany({ where: { user_id: userId } }),
      prisma.account.deleteMany({ where: { user_id: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE')
  return res.status(405).end()
}
