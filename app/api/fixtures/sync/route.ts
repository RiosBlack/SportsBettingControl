import { NextResponse } from "next/server";
import { syncDailyFixtures } from "@/lib/actions/fixtures";

export async function GET() {
  try {
    const result = await syncDailyFixtures();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to sync fixtures" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      footballCount: result.footballCount || 0,
      basketballCount: result.basketballCount || 0,
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

