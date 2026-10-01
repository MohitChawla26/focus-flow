import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { binodProfile, demoItems } from "@/data/demo";
import { scoreAll } from "@/services/importanceScoring";

export default function Home() {
  return <DashboardClient initialItems={scoreAll(demoItems, binodProfile)} />;
}
