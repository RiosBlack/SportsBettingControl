import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncUserDatabase } from "@/lib/actions/database-sync";

export const maxDuration = 300;

/** Atualização manual incremental do banco (usuário autenticado). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await syncUserDatabase();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.message,
          fixtures: result.fixtures,
          statistics: result.statistics,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      fixtures: result.fixtures,
      statistics: result.statistics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("[database/sync]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
