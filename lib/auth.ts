import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  session: {
    strategy: "database", // Prismaにセッションを保存 -> ユーザーごとのデータ管理がしやすい
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
};
