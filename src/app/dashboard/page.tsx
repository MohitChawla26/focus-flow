import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getDashboardData, getSourceStatuses } from "@/services/dashboardDataService";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");
  if (!data.onboardingCompleted) redirect("/onboarding");

  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Calcutta",
  }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardClient
      initialItems={data.items}
      initialReadItemIds={data.readItemIds}
      initialHiddenItemIds={data.hiddenItemIds}
      initialSavedItemIds={data.savedItemIds}
      initialProjects={data.projects}
      userName={data.userName}
      userEmail={data.user.email ?? ""}
      interests={data.interests}
      sourceStatuses={getSourceStatuses()}
      nowIso={now.toISOString()}
      currentDate={new Intl.DateTimeFormat("en-IN", {
        dateStyle: "full",
        timeZone: "Asia/Calcutta",
      }).format(now)}
      greeting={greeting}
    />
  );
}
