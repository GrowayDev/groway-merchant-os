import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            merchantUsers: {
              where: { isActive: true },
              include: { merchant: true },
            },
          },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          image: user.avatar || undefined,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Check if user exists
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        })

        if (!existingUser) {
          // Create new user for Google OAuth
          await db.user.create({
            data: {
              id: `google-${user.id}`,
              email: user.email!,
              name: user.name || '',
              role: 'user',
              status: 'active',
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        
        // Get merchant info for the user
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email! },
          include: {
            merchantUsers: {
              where: { isActive: true },
              include: { merchant: true },
            },
          },
        })
        
        if (dbUser && dbUser.merchantUsers.length > 0) {
          const merchantUser = dbUser.merchantUsers[0]
          ;(session.user as any).merchant = {
            id: merchantUser.merchant.id,
            code: merchantUser.merchant.code,
            name: merchantUser.merchant.name,
            vertical: merchantUser.merchant.vertical,
          }
          ;(session.user as any).role = merchantUser.role
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/merchant-os/login',
    error: '/merchant-os/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
