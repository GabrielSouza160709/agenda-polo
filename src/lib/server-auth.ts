import type { IncomingMessage, ServerResponse } from 'node:http'
import { prisma } from '@/lib/prisma'
import { buildNextAuthOptions } from '@/pages/api/auth/[...nextauth].api'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

type SessionRequest =
  | NextApiRequest
  | (IncomingMessage & { cookies: Partial<Record<string, string>> })

type SessionResponse = NextApiResponse | ServerResponse<IncomingMessage>

export async function getActiveUser(req: SessionRequest, res: SessionResponse) {
  const session = await getServerSession(
    req,
    res,
    buildNextAuthOptions(req, res),
  )

  if (!session?.user?.email) {
    return { status: 401 as const, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user || !user.isActive) {
    return { status: 403 as const, user: null }
  }

  return { status: 200 as const, user }
}
