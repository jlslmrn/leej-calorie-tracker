import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { profile: true },
      });

      if (dbUser && !dbUser.profile) {
        await prisma.userProfile.create({
          data: {
            userId: dbUser.id,
            displayName: user.name ?? null,
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};
