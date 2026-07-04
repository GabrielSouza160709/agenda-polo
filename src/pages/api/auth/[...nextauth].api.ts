import { PrismaAdapter } from '@/lib/auth/prisma-adapter'
import { isEmailAllowed } from '@/lib/auth/allowed-emails'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse, NextPageContext } from 'next'
import NextAuth, { type NextAuthOptions } from 'next-auth'
import Google, { type GoogleProfile } from 'next-auth/providers/google'

export function buildNextAuthOptions(
  req: NextApiRequest | NextPageContext['req'],
  res: NextApiResponse | NextPageContext['res'],
): NextAuthOptions {
  return {
    adapter: PrismaAdapter(req, res),
    secret: env.NEXTAUTH_SECRET,
    session: {
      strategy: 'jwt',
    },
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: 'openid email profile',
          },
        },
        profile(profile: GoogleProfile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            username: '',
            avatar_url: profile.picture,
            role: 'USER',
            isActive: true,
          }
        },
      }),
    ],
    callbacks: {
      async signIn({ user }) {
        if (!isEmailAllowed(env.ALLOWED_EMAILS, user.email)) {
          return '/auth/error?error=AccessDenied'
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true },
        })

        return existingUser?.isActive ?? true
      },
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id
          token.name = user.name
          token.email = user.email
          token.username = user.username
          token.avatar_url = user.avatar_url
          token.role = user.role
          token.isActive = user.isActive
        }

        return token
      },
      async session({ session, token }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: String(token.id),
            name: String(token.name ?? ''),
            email: String(token.email ?? ''),
            username: String(token.username ?? ''),
            avatar_url: String(token.avatar_url ?? ''),
            role: token.role === 'ADMIN' ? 'ADMIN' : 'USER',
            isActive: token.isActive === true,
          },
        }
      },
    },
    pages: {
      newUser: '/agenda',
      signIn: '/agenda',
    },
  }
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, buildNextAuthOptions(req, res))
}
