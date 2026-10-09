import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'bigc',
      name: 'BigC Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API}/api/auth/login/bigc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const profile = await fetch(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          }).then(r => r.json());
          return { ...profile, accessToken: data.accessToken, type: 'bigc' };
        } catch {
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'supplier',
      name: 'Supplier Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API}/api/auth/login/supplier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const profile = await fetch(`${API}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          }).then(r => r.json());
          return { ...profile, accessToken: data.accessToken, mustChangePassword: data.mustChangePassword, type: 'supplier' };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.type = (user as any).type;
        token.accessToken = (user as any).accessToken;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
        type: token.type as string,
        accessToken: token.accessToken as string,
        mustChangePassword: token.mustChangePassword as boolean,
      } as any;
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
