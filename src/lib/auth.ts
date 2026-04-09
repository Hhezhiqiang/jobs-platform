import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// 静态用户数据（快速部署模式）
const ADMIN_USER = {
  id: "1",
  email: "admin@example.com",
  name: "管理员",
  // 密码: admin123
  password: "$2a$10$8d1XzJ9KqQpP9qYrZrTGWu8QeZyJvBz7Dq0Q0vBvF6K9gH2LvJqOa",
  role: "ADMIN",
};

export const authOptions: NextAuthOptions = {
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

        // 验证静态管理员账号
        if (credentials.email !== ADMIN_USER.email) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          ADMIN_USER.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          name: ADMIN_USER.name,
          role: ADMIN_USER.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
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
