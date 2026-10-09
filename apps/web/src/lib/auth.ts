import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
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
          if (!credentials?.email || !credentials?.password) return null;
          const user = await prisma.bigcUser.findUnique({ where: { email: credentials.email } });
          if (!user || user.status === 'INACTIVE') return null;
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            role: user.role as string,
            type: 'bigc',
            department: user.department,
            employeeNo: user.employeeNo,
          };
        } catch (err) {
          console.error('[Auth BigC Error]', err);
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
          if (!credentials?.email || !credentials?.password) return null;
          const supplier = await prisma.supplier.findUnique({ where: { contactEmail: credentials.email } });
          if (!supplier || supplier.accountStatus === 'INACTIVE') return null;
          const valid = await bcrypt.compare(credentials.password, supplier.passwordHash);
          if (!valid) return null;
          return {
            id: supplier.id,
            email: supplier.contactEmail,
            name: supplier.name,
            role: 'SUPPLIER',
            type: 'supplier',
            mustChangePassword: supplier.mustChangePassword,
          };
        } catch (err) {
          console.error('[Auth Supplier Error]', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.type = (user as any).type;
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
        mustChangePassword: token.mustChangePassword as boolean,
      } as any;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
