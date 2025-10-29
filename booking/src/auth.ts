import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    authorized: async ({ auth }) => {
      // Only allow specific email addresses
      const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || []
      return !!auth?.user?.email && allowedEmails.includes(auth.user.email)
    },
    async session({ session, token }) {
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
})
