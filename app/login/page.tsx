// app/login/page.tsx
import { authOptions } from "@/auth";
import AuthPage from "@/components/auth/AuthPage";
import { getUserOnboardingStatus } from "@/lib/onboarding-status";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    const isOnboarded = await getUserOnboardingStatus(session.user.email);
    redirect(isOnboarded ? "/tracker" : "/onboarding");
  }

  return <AuthPage />;
}
