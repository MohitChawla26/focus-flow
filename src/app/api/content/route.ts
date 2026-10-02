import { NextResponse } from "next/server";

import { ingestSourcesForCurrentUser } from "@/services/contentIngestionService";
import { getDashboardData } from "@/services/dashboardDataService";

export async function GET() {
  const data = await getDashboardData();
  if (!data) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    mode: "database",
    items: data.items,
    warnings: data.warnings,
  });
}

export async function POST() {
  const result = await ingestSourcesForCurrentUser();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const failed = result.created === 0 && result.fetched > 0 && result.warnings.some((warning) =>
    warning.startsWith("Supabase insert:"),
  );

  return NextResponse.json(result, { status: failed ? 500 : 200 });
}
