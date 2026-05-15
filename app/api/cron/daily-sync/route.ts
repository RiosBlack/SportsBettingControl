import { NextResponse } from "next/server";
import { syncSystemDatabase } from "@/lib/actions/database-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cronHeader = request.headers.get("x-cron-secret");
  return cronHeader === secret;
}

/** Cron diário: fixtures do dia + estatísticas incrementais (só o que falta). */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await syncSystemDatabase();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.message,
          fixtures: result.fixtures,
          statistics: result.statistics,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      fixtures: result.fixtures,
      statistics: result.statistics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron sync failed";
    console.error("[cron/daily-sync]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
