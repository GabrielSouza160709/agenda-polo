import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_DIRECT_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  INITIAL_ADMIN_EMAIL: z.string().email(),
  ALLOWED_EMAILS: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    'Variáveis de ambiente obrigatórias inválidas:',
    parsedEnv.error.flatten().fieldErrors,
  )
  throw new Error('Configuração de ambiente inválida.')
}

export const env = parsedEnv.data
