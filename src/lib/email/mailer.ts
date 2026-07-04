import '@/lib/dayjs'
import { env } from '@/lib/env'
import dayjs from 'dayjs'
import nodemailer from 'nodemailer'

export function isSMTPConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)
}

function createTransport() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!isSMTPConfigured()) {
    return
  }

  try {
    const transport = createTransport()
    await transport.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  } catch (err) {
    console.error('[mailer] Erro ao enviar email:', err)
  }
}

interface ReservationEmailData {
  title: string
  startsAt: Date | string
  endsAt: Date | string
  needsPrivacy: boolean
  notes?: string | null
}

interface Recipient {
  name: string
  email: string
}

function formatDate(date: Date | string): string {
  return dayjs(date).format('dddd, D [de] MMMM [de] YYYY')
}

function formatTime(date: Date | string): string {
  return dayjs(date).format('HH:mm')
}

function buildEmailHtml({
  actionLabel,
  reservation,
  actorName,
  recipientName,
}: {
  actionLabel: string
  reservation: ReservationEmailData
  actorName: string | null
  recipientName: string
}): string {
  const isPrivate = reservation.needsPrivacy
  const displayTitle = isPrivate ? 'Sala reservada' : reservation.title
  const dateStr = formatDate(reservation.startsAt)
  const timeStr = `${formatTime(reservation.startsAt)} – ${formatTime(reservation.endsAt)}`

  const responsavelRow =
    !isPrivate && actorName
      ? `<tr>
          <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px;">Responsável</td>
          <td style="padding:4px 0;color:#111827;font-size:13px;">${escapeHtml(actorName)}</td>
        </tr>`
      : ''

  const observacoesRow =
    !isPrivate && reservation.notes
      ? `<tr>
          <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px;">Observações</td>
          <td style="padding:4px 0;color:#111827;font-size:13px;">${escapeHtml(reservation.notes)}</td>
        </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(actionLabel)} — Polo Agenda</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#f97316;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Polo Agenda</p>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${escapeHtml(actionLabel)}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#f97316;text-transform:uppercase;letter-spacing:0.6px;">Detalhes da reserva</p>
              <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${escapeHtml(displayTitle)}</h1>

              <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:0;">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px;">Data</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;">${escapeHtml(dateStr)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:13px;white-space:nowrap;padding-right:16px;">Horário</td>
                  <td style="padding:4px 0;color:#111827;font-size:13px;">${escapeHtml(timeStr)}</td>
                </tr>
                ${responsavelRow}
                ${observacoesRow}
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
                Olá, ${escapeHtml(recipientName)}. Esta é uma notificação automática do sistema de agenda da sala de reunião.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Polo Negócios Imobiliários — Sistema de Agenda</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendReservationCreated({
  reservation,
  createdByName,
  recipients,
}: {
  reservation: ReservationEmailData
  createdByName: string
  recipients: Recipient[]
}): Promise<void> {
  const actionLabel = 'Nova reserva criada'

  for (const recipient of recipients) {
    const html = buildEmailHtml({
      actionLabel,
      reservation,
      actorName: createdByName,
      recipientName: recipient.name,
    })

    await sendEmail({
      to: recipient.email,
      subject: `[Polo Agenda] ${actionLabel}: ${reservation.needsPrivacy ? 'Sala reservada' : reservation.title}`,
      html,
    })
  }
}

export async function sendReservationUpdated({
  reservation,
  updatedByName,
  recipients,
}: {
  reservation: ReservationEmailData
  updatedByName: string
  recipients: Recipient[]
}): Promise<void> {
  const actionLabel = 'Reserva atualizada'

  for (const recipient of recipients) {
    const html = buildEmailHtml({
      actionLabel,
      reservation,
      actorName: updatedByName,
      recipientName: recipient.name,
    })

    await sendEmail({
      to: recipient.email,
      subject: `[Polo Agenda] ${actionLabel}: ${reservation.needsPrivacy ? 'Sala reservada' : reservation.title}`,
      html,
    })
  }
}

export async function sendReservationCancelled({
  reservation,
  cancelledByName,
  recipients,
}: {
  reservation: ReservationEmailData
  cancelledByName: string
  recipients: Recipient[]
}): Promise<void> {
  const actionLabel = 'Reserva cancelada'

  for (const recipient of recipients) {
    const html = buildEmailHtml({
      actionLabel,
      reservation,
      actorName: cancelledByName,
      recipientName: recipient.name,
    })

    await sendEmail({
      to: recipient.email,
      subject: `[Polo Agenda] ${actionLabel}: ${reservation.needsPrivacy ? 'Sala reservada' : reservation.title}`,
      html,
    })
  }
}
