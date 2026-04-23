import { NextAuthOptions, Account, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { getPrisma } from "@/lib/prisma";

const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60;

interface AuthToken extends JWTPayload {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
}

// Lazy PrismaAdapter — only created when first needed, NOT at module load
let _adapter: NextAuthOptions["adapter"] | null = null;
const getAdapter = (): NextAuthOptions["adapter"] => {
  if (!_adapter) {
    const { PrismaAdapter } = require("@auth/prisma-adapter");
    _adapter = PrismaAdapter(getPrisma()) as unknown as NextAuthOptions["adapter"];
  }
  return _adapter;
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: {
    // Lazy wrapper — all adapter methods defer to the real adapter
    createUser: (data) => getAdapter().createUser(data),
    getUser: (id) => getAdapter().getUser(id),
    getUserByEmail: (email) => getAdapter().getUserByEmail(email),
    getUserByAccount: (providerAccount) => getAdapter().getUserByAccount(providerAccount),
    updateUser: (data) => getAdapter().updateUser(data),
    deleteUser: (userId) => getAdapter().deleteUser(userId),
    linkAccount: (data) => getAdapter().linkAccount(data),
    unlinkAccount: (providerAccount) => getAdapter().unlinkAccount(providerAccount),
    createSession: (data) => getAdapter().createSession(data),
    getSessionAndUser: (sessionToken) => getAdapter().getSessionAndUser(sessionToken),
    updateSession: (data) => getAdapter().updateSession(data),
    deleteSession: (sessionToken) => getAdapter().deleteSession(sessionToken),
    createVerificationToken: (data) => getAdapter().createVerificationToken(data),
    useVerificationToken: (data) => getAdapter().useVerificationToken(data),
  } as NextAuthOptions["adapter"],
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

        const prisma = getPrisma();
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: DEFAULT_MAX_AGE,
    async encode({ token, secret }) {
      const signingKey = new TextEncoder().encode(secret as string);
      const tokenRecord = token as Record<string, unknown>;
      return await new SignJWT(tokenRecord)
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
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};
