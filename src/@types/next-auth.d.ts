import NextAuth from 'next-auth'

declare module 'next-auth' {
  export interface User {
    id: string
    name: string
    email: string
    username: string
    avatar_url: string
    role: 'USER' | 'ADMIN'
    isActive: boolean
  }
  interface Session {
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    avatar_url: string | null
    role: 'USER' | 'ADMIN'
    isActive: boolean
  }
}
