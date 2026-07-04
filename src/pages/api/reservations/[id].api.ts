import { sendReservationCancelled, sendReservationUpdated } from '@/lib/email/mailer'
import { prisma } from '@/lib/prisma'
import { checkReservationRateLimit } from '@/lib/rate-limit'
import {
  isOverlapError,
  updateReservationSchema,
} from '@/lib/reservation-validation'
import { getActiveUser } from '@/lib/server-auth'
import type { Reservation, User } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ZodError } from 'zod'

type ReservationWithCreator = Reservation & {
  createdBy: Pick<User, 'id' | 'name' | 'avatar_url'>
}

function serializeReservation(
  reservation: ReservationWithCreator,
  currentUser: User,
) {
  return {
    id: reservation.id,
    title: reservation.title,
    notes: reservation.notes,
    startsAt: reservation.startsAt.toISOString(),
    endsAt: reservation.endsAt.toISOString(),
    needsPrivacy: reservation.needsPrivacy,
    status: reservation.status,
    version: reservation.version,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    creator: {
      id: reservation.createdBy.id,
      name: reservation.createdBy.name,
      image: reservation.createdBy.avatar_url,
    },
    canEdit:
      reservation.createdBy.id === currentUser.id ||
      currentUser.role === 'ADMIN',
  }
}

function canManageReservation(reservation: Reservation, user: User) {
  return reservation.createdById === user.id || user.role === 'ADMIN'
}

function handleValidationError(res: NextApiResponse, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: error.flatten().fieldErrors,
    })
  }

  return null
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const activeUser = await getActiveUser(req, res)

  if (!activeUser.user) {
    return res.status(activeUser.status).json({
      message:
        activeUser.status === 401
          ? 'Não autenticado.'
          : 'Usuário sem permissão.',
    })
  }

  const id = String(req.query.id)
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  })

  if (!reservation) {
    return res.status(404).json({
      message: 'Reserva não encontrada.',
    })
  }

  if (!canManageReservation(reservation, activeUser.user)) {
    return res.status(403).json({
      message: 'Você não tem permissão para alterar esta reserva.',
    })
  }

  if (req.method === 'PATCH') {
    if (!checkReservationRateLimit(activeUser.user.id)) {
      return res.status(429).json({
        message: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
      })
    }

    try {
      const body = updateReservationSchema.parse(req.body)
      const startsAt = body.startsAt
        ? new Date(body.startsAt)
        : reservation.startsAt
      const endsAt = body.endsAt ? new Date(body.endsAt) : reservation.endsAt

      if (startsAt >= endsAt) {
        return res.status(400).json({
          message: 'O início deve ser anterior ao término.',
        })
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
          ...(body.startsAt !== undefined ? { startsAt } : {}),
          ...(body.endsAt !== undefined ? { endsAt } : {}),
          ...(body.needsPrivacy !== undefined
            ? { needsPrivacy: body.needsPrivacy }
            : {}),
          version: { increment: 1 },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      })

      const updateRecipients = await prisma.user.findMany({
        where: { isActive: true, NOT: { id: activeUser.user.id } },
        select: { name: true, email: true },
      })

      sendReservationUpdated({
        reservation: updatedReservation,
        updatedByName: activeUser.user.name,
        recipients: updateRecipients.flatMap((u) =>
          u.email ? [{ name: u.name, email: u.email }] : [],
        ),
      }).catch((err) => console.error('Email error:', err))

      return res.status(200).json({
        reservation: serializeReservation(updatedReservation, activeUser.user),
      })
    } catch (error) {
      const handled = handleValidationError(res, error)
      if (handled) return handled

      if (isOverlapError(error)) {
        return res.status(409).json({
          message: 'Já existe uma reserva confirmada nesse horário.',
        })
      }

      throw error
    }
  }

  if (req.method === 'DELETE') {
    const cancelledReservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        version: { increment: 1 },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    })

    const cancelRecipients = await prisma.user.findMany({
      where: { isActive: true, NOT: { id: activeUser.user.id } },
      select: { name: true, email: true },
    })

    sendReservationCancelled({
      reservation: cancelledReservation,
      cancelledByName: activeUser.user.name,
      recipients: cancelRecipients.flatMap((u) =>
        u.email ? [{ name: u.name, email: u.email }] : [],
      ),
    }).catch((err) => console.error('Email error:', err))

    return res.status(200).json({
      reservation: serializeReservation(cancelledReservation, activeUser.user),
    })
  }

  res.setHeader('Allow', 'PATCH, DELETE')
  return res.status(405).end()
}
