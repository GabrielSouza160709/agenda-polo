import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'
import type { NextApiRequest, NextApiResponse, NextPageContext } from 'next'
import type { Adapter } from 'next-auth/adapters'

function toAdapterUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email!,
    emailVerified: null,
    image: null,
    username: user.username,
    avatar_url: user.avatar_url!,
    role: user.role,
    isActive: user.isActive,
  }
}

interface Account {
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string | null
  access_token?: string | null
  expires_at?: number | null
  token_type?: string | null
  scope?: string | null
  id_token?: string | null
  session_state?: string | null
}
export function PrismaAdapter(
  _req: NextApiRequest | NextPageContext['req'],
  _res: NextApiResponse | NextPageContext['res'],
): Adapter {
  return {
    async createUser(user: User) {
      if (!user.email) {
        throw new Error('User email not found.')
      }

      const prismaUser = await prisma.user.create({
        data: {
          name: user.name ?? user.email,
          email: user.email,
          username: user.email,
          avatar_url: user.avatar_url,
        },
      })

      return toAdapterUser(prismaUser)
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      })
      if (!user) {
        return null
      }

      return toAdapterUser(user)
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })
      if (!user) {
        return null
      }

      return toAdapterUser(user)
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
        include: {
          user: true,
        },
      })
      if (!account) {
        return null
      }
      const { user } = account
      return toAdapterUser(user)
    },
    async updateUser(user) {
      const prismaUser = await prisma.user.update({
        where: {
          id: user.id!,
        },
        data: {
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      })
      return toAdapterUser(prismaUser)
    },

    async linkAccount(account: Account) {
      await prisma.account.create({
        data: {
          user_id: account.userId,
          type: account.type,
          provider: account.provider,
          provider_account_id: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      })
    },
    async createSession({ sessionToken, userId, expires }) {
      await prisma.session.create({
        data: {
          user_id: userId,
          expires,
          session_token: sessionToken,
        },
      })
      return {
        userId,
        sessionToken,
        expires,
      }
    },
    async getSessionAndUser(sessionToken) {
      const prismaSession = await prisma.session.findUnique({
        where: {
          session_token: sessionToken,
        },
        include: {
          user: true,
        },
      })
      if (!prismaSession) {
        return null
      }
      const { user, ...session } = prismaSession
      return {
        session: {
          userId: user.id,
          expires: session.expires,
          sessionToken: session.session_token,
        },
        user: toAdapterUser(user),
      }
    },
    async updateSession({ sessionToken, userId, expires }) {
      const prismaSession = await prisma.session.update({
        where: {
          session_token: sessionToken,
        },
        data: {
          expires,
          user_id: userId,
        },
      })

      return {
        userId: prismaSession.user_id,
        expires: prismaSession.expires,
        sessionToken: prismaSession.session_token,
      }
    },
    async deleteSession(sessionToken) {
      await prisma.session.delete({
        where: {
          session_token: sessionToken,
        },
      })
    },
  }
}
