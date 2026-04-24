import { NextAuthOptions, Adapter } from "next-auth";
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

let _adapterPromise: Promise<Adapter> | null = null;

async function loadAdapter(): Promise<Adapter> {
  if (!_adapterPromise) {
    _adapterPromise = (async () => {
      const [{ PrismaAdapter }, { prisma }] = await Promise.all([
        import("@auth/prisma-adapter"),
        import("@/lib/prisma"),
      ]);
      return PrismaAdapter(prisma) as Adapter;
    })();
  }
  return _adapterPromise;
}

// Lazy adapter wrapper for next-auth
const lazyAdapter: Adapter = {
  createUser: async (data) => (await loadAdapter()).createUser(data),
  getUser: async (id) => (await loadAdapter()).getUser(id),
  getUserByEmail: async (email) => (await loadAdapter()).getUserByEmail(email),
  getUserByAccount: async (p) => (await loadAdapter()).getUserByAccount(p),
  updateUser: async (data) => (await loadAdapter()).updateUser(data),
  deleteUser: async (userId) => (await loadAdapter()).deleteUser(userId),
  linkAccount: async (data) => (await loadAdapter()).linkAccount(data),
  unlinkAccount: async (p) => (await loadAdapter()).unlinkAccount(p),
  createSession: async (data) => (await loadAdapter()).createSession(data),
  getSessionAndUser: async (token) => (await loadAdapter()).getSessionAndUser(token),
  updateSession: async (data) => (await loadAdapter()).updateSession(data),
  deleteSession: async (token) => (await loadAdapter()).deleteSession(token),
  createVerificationToken: async (data) => (await loadAdapter()).createVerificationToken(data),
  useVerificationToken: async (data) => (await loadAdapter()).useVerificationToken(data),
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: lazyAdapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.users.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: {
    maxAge: DEFAULT_MAX_AGE,
    async encode({ token, secret }) {
      const key = new TextEncoder().encode(secret as string);
      return new SignJWT(token as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(key);
    },
    async decode({ token, secret }) {
      if (!token) return null;
      try {
        const key = new TextEncoder().encode(secret as string);
        const { payload } = await jwtVerify(token, key);
        return payload as AuthToken;
      } catch { return null; }
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) { return url.startsWith(baseUrl) || url.startsWith("/") ? url : baseUrl; },
    async jwt({ token, user }) { if (user) { token.id = user.id; token.role = user.role; } return token; },
    async session({ session, token }) { if (token?.id) { session.user.id = token.id; session.user.role = token.role; } return session; },
  },
  pages: { signIn: "/auth/login", error: "/auth/error" },
};
