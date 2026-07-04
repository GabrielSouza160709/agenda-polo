import { AppShell, type AppUser } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { prisma } from '@/lib/prisma'
import {
  type ReservationDTO,
  formatDateTimeRange,
} from '@/lib/reservation-client'
import { getActiveUser } from '@/lib/server-auth'
import { cn } from '@/lib/utils'
import { AlertTriangle, CalendarDays, Loader2 } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useState } from 'react'

const PAGE_SIZE = 10

interface MyReservationsProps {
  user: AppUser
  reservations: ReservationDTO[]
  page: number
  totalPages: number
}

async function readApiError(response: Response) {
  try {
    const payload = await response.json()
    return payload.message || 'Não foi possível cancelar a reserva.'
  } catch {
    return 'Não foi possível cancelar a reserva.'
  }
}

function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
}

export default function MyReservations({
  user,
  reservations: initialReservations,
  page,
  totalPages,
}: MyReservationsProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<ReservationDTO | null>(
    null,
  )
  const { toast } = useToast()

  async function cancelReservation(reservation: ReservationDTO) {
    setLoadingId(reservation.id)
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await readApiError(response))
      }

      const payload = (await response.json()) as { reservation: ReservationDTO }
      setReservations((current) =>
        current.map((item) =>
          item.id === reservation.id ? payload.reservation : item,
        ),
      )
      setConfirmCancel(null)
      toast({
        title: 'Reserva cancelada',
        description: 'O status foi atualizado no banco.',
        tone: 'success',
      })
    } catch (error) {
      toast({
        title: 'Não foi possível cancelar',
        description:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        tone: 'error',
      })
    } finally {
      setLoadingId(null)
    }
  }

  const previousPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  return (
    <AppShell user={user}>
      <div className="grid gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-foreground">
            Minhas Reservas
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas reservas e cancele horários futuros.
          </p>
        </div>

        <section className="grid gap-3" aria-label="Lista de reservas">
          {reservations.length === 0 ? (
            <div className="grid gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-sm)]">
              <CalendarDays
                className="mx-auto h-12 w-12 text-border"
                aria-hidden="true"
              />
              <div className="grid gap-1">
                <h2 className="text-base font-semibold text-foreground">
                  Nenhuma reserva ainda
                </h2>
                <p className="text-sm text-muted-foreground">
                  Suas reservas aparecerão aqui.
                </p>
              </div>
              <div>
                <Button asChild>
                  <Link href="/agenda">Fazer primeira reserva</Link>
                </Button>
              </div>
            </div>
          ) : (
            reservations.map((reservation) => {
              const future = new Date(reservation.startsAt) > new Date()
              const canCancel =
                reservation.status === 'CONFIRMED' &&
                future &&
                reservation.canEdit

              return (
                <article
                  key={reservation.id}
                  className="grid gap-3 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-sm)] sm:p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="grid min-w-0 gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h2 className="min-w-0 truncate text-[15px] font-semibold text-foreground">
                        {reservation.title}
                      </h2>
                      <Badge
                        variant={
                          reservation.needsPrivacy ? 'privacy' : 'success'
                        }
                      >
                        {reservation.needsPrivacy ? 'Privada' : 'Aberta'}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <CalendarDays
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      {formatDateTimeRange(
                        reservation.startsAt,
                        reservation.endsAt,
                      )}
                    </p>
                    {reservation.notes ? (
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {reservation.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Badge
                      variant={
                        reservation.status === 'CONFIRMED'
                          ? 'success'
                          : 'destructive'
                      }
                    >
                      {reservation.status === 'CONFIRMED'
                        ? 'Confirmada'
                        : 'Cancelada'}
                    </Badge>
                    {canCancel ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-[var(--error-subtle)] hover:text-destructive"
                        disabled={loadingId === reservation.id}
                        onClick={() => setConfirmCancel(reservation)}
                      >
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })
          )}
        </section>

        <div className="flex items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className={cn(page <= 1 && 'pointer-events-none opacity-50')}
          >
            <Link
              href={`/minhas-reservas?page=${previousPage}`}
              aria-disabled={page <= 1}
            >
              Anterior
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            asChild
            variant="outline"
            className={cn(
              page >= totalPages && 'pointer-events-none opacity-50',
            )}
          >
            <Link
              href={`/minhas-reservas?page=${nextPage}`}
              aria-disabled={page >= totalPages}
            >
              Próxima
            </Link>
          </Button>
        </div>

        <p className="mt-2 text-center text-[11px] text-[var(--text-muted)] md:hidden">
          Desenvolvido por Gabriel Souza
        </p>
      </div>

      <Dialog
        open={Boolean(confirmCancel)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCancel(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="h-5 w-5 text-destructive"
                aria-hidden="true"
              />
              Cancelar reserva?
            </DialogTitle>
            <DialogDescription>
              Esta ação libera o horário na agenda da sala.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(loadingId)}
              onClick={() => setConfirmCancel(null)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(loadingId)}
              onClick={() => {
                if (confirmCancel) {
                  cancelReservation(confirmCancel)
                }
              }}
            >
              {loadingId ? <Spinner /> : null}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export const getServerSideProps: GetServerSideProps<
  MyReservationsProps
> = async ({ req, res, query }) => {
  const activeUser = await getActiveUser(req, res)

  if (!activeUser.user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const total = await prisma.reservation.count({
    where: {
      createdById: activeUser.user.id,
    },
  })
  const reservations = await prisma.reservation.findMany({
    where: {
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
    orderBy: {
      startsAt: 'asc',
    },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  return {
    props: {
      user: {
        name: activeUser.user.name,
        email: activeUser.user.email ?? '',
        image: activeUser.user.avatar_url,
        role: activeUser.user.role,
      },
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        title: reservation.title,
        notes: reservation.notes,
        startsAt: reservation.startsAt.toISOString(),
        endsAt: reservation.endsAt.toISOString(),
        needsPrivacy: reservation.needsPrivacy,
        status: reservation.status,
        version: reservation.version,
        creator: {
          id: reservation.createdBy.id,
          name: reservation.createdBy.name,
          image: reservation.createdBy.avatar_url,
        },
        canEdit: true,
      })),
    },
  }
}
