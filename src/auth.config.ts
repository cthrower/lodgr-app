import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname === '/login'
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')

      if (isApiAuthRoute) return true
      if (!isLoggedIn && !isOnLoginPage) return false
      if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL('/projects', nextUrl))
      }
      return true
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [],
}
