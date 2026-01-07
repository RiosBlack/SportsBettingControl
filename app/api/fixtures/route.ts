import { NextResponse } from "next/server";
import { getTodayFixtures } from "@/lib/actions/fixtures";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let targetDate: Date | undefined;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: "Data inválida" },
          { status: 400 }
        );
      }
    }

    const result = await getTodayFixtures(undefined, targetDate);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to get fixtures" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error: any) {
    console.error("Error in fixtures endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get fixtures" },
      { status: 500 }
    );
  }
}

