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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
  BUSINESS_HOURS,
  BUSINESS_HOURS_ERROR,
  type ReservationDTO,
  type ReservationFormValues,
  formatDateTimeRange,
  isValidBusinessEndTime,
  isValidBusinessStartTime,
  localFieldsToIso,
  reservationToFormValues,
} from '@/lib/reservation-client'
import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

type DialogState =
  | {
      type: 'create'
      defaults: ReservationFormValues
    }
  | {
      type: 'details'
      reservation: ReservationDTO
    }
  | {
      type: 'edit'
      reservation: ReservationDTO
    }

type ReservationDialogResult =
  | {
      action: 'create'
      reservation: ReservationDTO
    }
  | {
      action: 'edit'
      reservation: ReservationDTO
    }
  | {
      action: 'cancel'
      reservation: ReservationDTO
    }

type FieldName = keyof ReservationFormValues
type FieldErrors = Partial<Record<FieldName, string>>
type TouchedFields = Partial<Record<FieldName, boolean>>

interface ReservationDialogProps {
  state: DialogState | null
  onOpenChange: (open: boolean) => void
  onChangeState: (state: DialogState | null) => void
  onSuccess: (result: ReservationDialogResult) => Promise<void>
}

async function readApiError(response: Response) {
  try {
    const payload = await response.json()
    return payload.message || 'Não foi possível concluir a operação.'
  } catch {
    return 'Não foi possível concluir a operação.'
  }
}

function validateReservationFields(values: ReservationFormValues): FieldErrors {
  const errors: FieldErrors = {}
  const title = values.title.trim()

  if (!title) {
    errors.title = 'Informe o título da reserva.'
  } else if (title.length > 120) {
    errors.title = 'O título deve ter no máximo 120 caracteres.'
  }

  if (!values.date) {
    errors.date = 'Informe a data da reserva.'
  }

  if (!values.startsAt) {
    errors.startsAt = 'Informe o horário de início.'
  }

  if (!values.endsAt) {
    errors.endsAt = 'Informe o horário de término.'
  }

  if (!errors.startsAt && !isValidBusinessStartTime(values.startsAt)) {
    errors.startsAt = BUSINESS_HOURS_ERROR
  }

  if (!errors.endsAt && !isValidBusinessEndTime(values.endsAt)) {
    errors.endsAt = BUSINESS_HOURS_ERROR
  }

  if (!errors.date && !errors.startsAt && !errors.endsAt) {
    try {
      const startIso = localFieldsToIso(values.date, values.startsAt)
      const endIso = localFieldsToIso(values.date, values.endsAt)
      const start = new Date(startIso)
      const end = new Date(endIso)

      if (start >= end) {
        errors.endsAt = 'O término deve ser depois do início.'
      } else if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
        errors.endsAt = 'A duração mínima é de 15 minutos.'
      } else if (start < new Date()) {
        errors.startsAt = 'Não é possível criar uma reserva no passado.'
      }
    } catch {
      errors.date = 'Informe uma data e horários válidos.'
    }
  }

  return errors
}

function firstErrorField(errors: FieldErrors) {
  return (['title', 'date', 'startsAt', 'endsAt'] as FieldName[]).find(
    (field) => errors[field],
  )
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
}

function ReservationFields({
  values,
  errors,
  touched,
  onBlur,
  onChange,
}: {
  values: ReservationFormValues
  errors: FieldErrors
  touched: TouchedFields
  onBlur: (field: FieldName) => void
  onChange: (values: ReservationFormValues) => void
}) {
  const titleError = touched.title ? errors.title : undefined
  const dateError = touched.date ? errors.date : undefined
  const startsAtError = touched.startsAt ? errors.startsAt : undefined
  const endsAtError = touched.endsAt ? errors.endsAt : undefined

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="reservation-title">Título *</Label>
        <Input
          id="reservation-title"
          value={values.title}
          maxLength={120}
          onBlur={() => onBlur('title')}
          onChange={(event) =>
            onChange({ ...values, title: event.currentTarget.value })
          }
          placeholder="Ex: Reunião com cliente"
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? 'reservation-title-error' : undefined}
        />
        <ErrorMessage id="reservation-title-error" message={titleError} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="reservation-date">Data *</Label>
          <Input
            id="reservation-date"
            type="date"
            value={values.date}
            onBlur={() => onBlur('date')}
            onChange={(event) =>
              onChange({ ...values, date: event.currentTarget.value })
            }
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? 'reservation-date-error' : undefined}
          />
          <ErrorMessage id="reservation-date-error" message={dateError} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reservation-start">Horário de início *</Label>
          <Input
            id="reservation-start"
            type="time"
            step={900}
            min={BUSINESS_HOURS.start}
            max={BUSINESS_HOURS.latestStart}
            value={values.startsAt}
            onBlur={() => onBlur('startsAt')}
            onChange={(event) =>
              onChange({ ...values, startsAt: event.currentTarget.value })
            }
            aria-invalid={Boolean(startsAtError)}
            aria-describedby={
              startsAtError ? 'reservation-start-error' : undefined
            }
          />
          <ErrorMessage id="reservation-start-error" message={startsAtError} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reservation-end">Horário de término *</Label>
          <Input
            id="reservation-end"
            type="time"
            step={900}
            min={BUSINESS_HOURS.earliestEnd}
            max={BUSINESS_HOURS.end}
            value={values.endsAt}
            onBlur={() => onBlur('endsAt')}
            onChange={(event) =>
              onChange({ ...values, endsAt: event.currentTarget.value })
            }
            aria-invalid={Boolean(endsAtError)}
            aria-describedby={endsAtError ? 'reservation-end-error' : undefined}
          />
          <ErrorMessage id="reservation-end-error" message={endsAtError} />
        </div>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-border p-3">
        <div className="grid gap-1">
          <Label htmlFor="reservation-privacy">Precisa de privacidade</Label>
          <p className="text-xs text-muted-foreground">
            A sala aparecerá como ocupada para outros usuários.
          </p>
        </div>
        <Switch
          id="reservation-privacy"
          checked={values.needsPrivacy}
          onCheckedChange={(checked) =>
            onChange({ ...values, needsPrivacy: checked })
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="reservation-notes">Observações</Label>
        <Textarea
          id="reservation-notes"
          rows={3}
          value={values.notes}
          onBlur={() => onBlur('notes')}
          onChange={(event) =>
            onChange({ ...values, notes: event.currentTarget.value })
          }
          placeholder="Pauta, links ou instruções internas."
        />
      </div>
    </div>
  )
}

export function ReservationDialog({
  state,
  onOpenChange,
  onChangeState,
  onSuccess,
}: ReservationDialogProps) {
  const { toast } = useToast()
  const [values, setValues] = useState<ReservationFormValues | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({})
  const [loading, setLoading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState<ReservationDTO | null>(
    null,
  )

  useEffect(() => {
    setErrors({})
    setTouched({})
    setConfirmCancel(null)

    if (!state) {
      setValues(null)
      return
    }

    if (state.type === 'create') {
      setValues(state.defaults)
      return
    }

    if (state.type === 'edit') {
      setValues(reservationToFormValues(state.reservation))
      return
    }

    setValues(null)
  }, [state])

  const open = Boolean(state)
  const hasErrors = Object.keys(errors).length > 0

  function updateValues(nextValues: ReservationFormValues) {
    setValues(nextValues)
    setErrors(validateReservationFields(nextValues))
  }

  function handleBlur(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }))
    if (values) {
      setErrors(validateReservationFields(values))
    }
  }

  function focusFirstError(nextErrors: FieldErrors) {
    const firstField = firstErrorField(nextErrors)
    if (!firstField) {
      return
    }

    const ids: Record<FieldName, string> = {
      title: 'reservation-title',
      date: 'reservation-date',
      startsAt: 'reservation-start',
      endsAt: 'reservation-end',
      needsPrivacy: 'reservation-privacy',
      notes: 'reservation-notes',
    }

    window.requestAnimationFrame(() => {
      document.getElementById(ids[firstField])?.focus()
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!state || !values || state.type === 'details') {
      return
    }

    const nextErrors = validateReservationFields(values)
    setErrors(nextErrors)
    setTouched({
      title: true,
      date: true,
      startsAt: true,
      endsAt: true,
    })

    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: values.title.trim(),
        notes: values.notes.trim() || null,
        startsAt: localFieldsToIso(values.date, values.startsAt),
        endsAt: localFieldsToIso(values.date, values.endsAt),
        needsPrivacy: values.needsPrivacy,
      }

      const response = await fetch(
        state.type === 'edit'
          ? `/api/reservations/${state.reservation.id}`
          : '/api/reservations',
        {
          method: state.type === 'edit' ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        throw new Error(await readApiError(response))
      }

      const result = (await response.json()) as { reservation: ReservationDTO }
      await onSuccess({
        action: state.type === 'edit' ? 'edit' : 'create',
        reservation: result.reservation,
      })
      onOpenChange(false)
      toast({
        title: state.type === 'edit' ? 'Reserva atualizada' : 'Reserva criada',
        description: 'A agenda da sala foi atualizada.',
        tone: 'success',
      })
    } catch (error) {
      toast({
        title: 'Não foi possível salvar',
        description:
          error instanceof Error
            ? error.message
            : 'Tente novamente em instantes.',
        tone: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  async function cancelReservation(reservation: ReservationDTO) {
    setLoading(true)
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await readApiError(response))
      }

      const result = (await response.json()) as { reservation: ReservationDTO }
      await onSuccess({ action: 'cancel', reservation: result.reservation })
      onOpenChange(false)
      toast({
        title: 'Reserva cancelada',
        description: 'O horário foi liberado na agenda.',
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
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setConfirmCancel(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        {confirmCancel ? (
          <>
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
                disabled={loading}
                onClick={() => setConfirmCancel(null)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={() => cancelReservation(confirmCancel)}
              >
                {loading ? <Spinner /> : null}
                Confirmar cancelamento
              </Button>
            </DialogFooter>
          </>
        ) : state?.type === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {state.reservation.needsPrivacy ? (
                  <Lock className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {state.reservation.title}
              </DialogTitle>
              <DialogDescription>
                {formatDateTimeRange(
                  state.reservation.startsAt,
                  state.reservation.endsAt,
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {state.reservation.creator.name}
                </Badge>
                <Badge
                  variant={
                    state.reservation.needsPrivacy ? 'privacy' : 'success'
                  }
                >
                  {state.reservation.needsPrivacy ? 'Privada' : 'Aberta'}
                </Badge>
              </div>
              {state.reservation.notes ? (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {state.reservation.notes}
                </p>
              ) : (
                <p className="text-muted-foreground">Sem observações.</p>
              )}
            </div>
            {state.reservation.canEdit ? (() => {
              const isFuture = new Date(state.reservation.startsAt) > new Date()
              return (
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <div>
                    {isFuture && state.reservation.status === 'CONFIRMED' ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-destructive text-destructive hover:bg-[var(--error-subtle)] hover:text-destructive sm:w-auto"
                        disabled={loading}
                        onClick={() => setConfirmCancel(state.reservation)}
                      >
                        Cancelar reserva
                      </Button>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      onChangeState({
                        type: 'edit',
                        reservation: state.reservation,
                      })
                    }
                  >
                    Editar
                  </Button>
                </DialogFooter>
              )
            })() : null}
          </>
        ) : (
          <form className="grid gap-4" onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle>
                {state?.type === 'edit' ? 'Editar reserva' : 'Nova reserva'}
              </DialogTitle>
              <DialogDescription>
                Defina o horário de uso da sala de reunião.
              </DialogDescription>
            </DialogHeader>
            {values ? (
              <ReservationFields
                values={values}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
                onChange={updateValues}
              />
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={loading || hasErrors}>
                {loading ? <Spinner /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export type { DialogState as ReservationDialogState, ReservationDialogResult }
