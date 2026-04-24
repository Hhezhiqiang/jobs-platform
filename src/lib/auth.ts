import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, JWTPayload } from "jose";

const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60;

interface AuthToken extends JWTPayload {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
}

let _adapter: NextAuthOptions["adapter"] | null = null;

function getAdapter(): NextAuthOptions["adapter"] {
  if (!_adapter) {
    const { PrismaAdapter } = require("@auth/prisma-adapter");
    const { prisma } = require("@/lib/prisma");
    _adapter = PrismaAdapter(prisma) as NextAuthOptions["adapter"];
  }
  return _adapter;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: {
    createUser: (data: any) => getAdapter().createUser(data),
    getUser: (id: string) => getAdapter().getUser(id),
    getUserByEmail: (email: string) => getAdapter().getUserByEmail(email),
    getUserByAccount: (p: any) => getAdapter().getUserByAccount(p),
    updateUser: (data: any) => getAdapter().updateUser(data),
    deleteUser: (userId: string) => getAdapter().deleteUser(userId),
    linkAccount: (data: any) => getAdapter().linkAccount(data),
    unlinkAccount: (p: any) => getAdapter().unlinkAccount(p),
    createSession: (data: any) => getAdapter().createSession(data),
    getSessionAndUser: (token: string) => getAdapter().getSessionAndUser(token),
    updateSession: (data: any) => getAdapter().updateSession(data),
    deleteSession: (token: string) => getAdapter().deleteSession(token),
    createVerificationToken: (data: any) => getAdapter().createVerificationToken(data),
    useVerificationToken: (data: any) => getAdapter().useVerificationToken(data),
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: {
    maxAge: DEFAULT_MAX_AGE,
    async encode({ token, secret }) {
      const signingKey = new TextEncoder().encode(secret as string);
      return await new SignJWT(token as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(signingKey);
    },
    async decode({ token, secret }) {
      if (!token) return null;
      try {
        const signingKey = new TextEncoder().encode(secret as string);
        const { payload } = await jwtVerify(token, signingKey);
        return payload as AuthToken;
      } catch {
        return null;
      }
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl) || url.startsWith("/")) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) { session.user.id = token.id; session.user.role = token.role; }
      return session;
    },
  },
  pages: { signIn: "/auth/login", error: "/auth/error" },
};
