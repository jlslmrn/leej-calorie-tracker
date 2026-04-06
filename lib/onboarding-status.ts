import { prisma } from "@/lib/prisma";

export async function getUserOnboardingStatus(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { isOnboarded: true },
  });

  return user?.isOnboarded ?? false;
}
