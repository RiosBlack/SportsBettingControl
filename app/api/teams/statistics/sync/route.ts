import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncUserDatabase } from "@/lib/actions/database-sync";

/** @deprecated Prefer POST /api/database/sync */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const result = await syncUserDatabase();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
