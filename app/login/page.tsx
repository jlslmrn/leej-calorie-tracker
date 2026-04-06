// app/login/page.tsx
import { authOptions } from "@/auth";
import AuthPage from "@/components/auth/AuthPage";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/onboarding");
  }

  return <AuthPage />;
}
