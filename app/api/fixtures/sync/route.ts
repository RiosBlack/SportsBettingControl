import { NextResponse } from "next/server";
import { syncDailyFixtures } from "@/lib/actions/fixtures";

export async function GET(request: Request) {
  try {
    // Permitir forçar sincronização via query parameter ?force=true
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await syncDailyFixtures(force);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to sync fixtures" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      footballCount: result.footballCount || 0,
      syncedAt: result.syncedAt,
    });
  } catch (error: any) {
    console.error("Error in sync endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync fixtures" },
      { status: 500 }
    );
  }
}
