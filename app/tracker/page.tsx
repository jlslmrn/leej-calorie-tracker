import { authOptions } from "@/auth";
import { getUserOnboardingStatus } from "@/lib/onboarding-status";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import TrackerClient from "./TrackerClient";

export default async function TrackerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const isOnboarded = await getUserOnboardingStatus(session.user.email);
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return <TrackerClient />;
}
