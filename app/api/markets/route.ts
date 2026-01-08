import { NextResponse } from "next/server";
import { getMarkets, createMarket } from "@/lib/actions/market";

export async function GET() {
  try {
    const result = await getMarkets();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to get markets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error: any) {
    console.error("Error in markets GET endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get markets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nome do mercado é obrigatório" },
        { status: 400 }
      );
    }

    const result = await createMarket(name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create market" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in markets POST endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create market" },
      { status: 500 }
    );
  }
}

