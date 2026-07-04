import { sendReservationCreated } from '@/lib/email/mailer'
import { prisma } from '@/lib/prisma'
import { checkReservationRateLimit } from '@/lib/rate-limit'
import {
  createReservationSchema,
  isOverlapError,
  reservationRangeQuerySchema,
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

  if (req.method === 'GET') {
    try {
      const query = reservationRangeQuerySchema.parse(req.query)
      const start = new Date(query.start)
      const end = new Date(query.end)

      if (start >= end) {
        return res.status(400).json({
          message: 'O início deve ser anterior ao término.',
        })
      }

      const reservations = await prisma.reservation.findMany({
        where: {
          status: 'CONFIRMED',
          startsAt: { lt: end },
          endsAt: { gt: start },
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
        orderBy: {
          startsAt: 'asc',
        },
      })

      return res.status(200).json({
        reservations: reservations.map((reservation) =>
          serializeReservation(reservation, activeUser.user),
        ),
      })
    } catch (error) {
      const handled = handleValidationError(res, error)
      if (handled) return handled
      throw error
    }
  }

  if (req.method === 'POST') {
    if (!checkReservationRateLimit(activeUser.user.id)) {
      return res.status(429).json({
        message: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
      })
    }

    try {
      const body = createReservationSchema.parse(req.body)

      if (new Date(body.startsAt) < new Date()) {
        return res.status(400).json({
          message: 'Não é possível criar uma reserva no passado.',
        })
      }

      const reservation = await prisma.reservation.create({
        data: {
          title: body.title,
          notes: body.notes || null,
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          needsPrivacy: body.needsPrivacy,
          createdById: activeUser.user.id,
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

      const recipients = await prisma.user.findMany({
        where: { isActive: true, NOT: { id: activeUser.user.id } },
        select: { name: true, email: true },
      })

      sendReservationCreated({
        reservation,
        createdByName: activeUser.user.name,
        recipients: recipients.flatMap((u) =>
          u.email ? [{ name: u.name, email: u.email }] : [],
        ),
      }).catch((err) => console.error('Email error:', err))

      return res.status(201).json({
        reservation: serializeReservation(reservation, activeUser.user),
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

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).end()
}
