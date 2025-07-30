// src/lib/auth.ts (novo arquivo)
import { type NextAuthOptions } from "next-auth";
import { type Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
          username: { label: "Usuário", type: "text" },
          password: { label: "Senha", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials.password) {
            throw new Error("Usuário e senha são obrigatórios.");
          }
  
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });
  
          if (user && (await bcrypt.compare(credentials.password, user.password))) {
            return { id: user.id, username: user.username, role: user.role };
          } else {
            throw new Error("Credenciais inválidas.");
          }
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
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};