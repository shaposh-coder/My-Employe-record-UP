import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vercel Cron endpoint. Protect with `CRON_SECRET` (Authorization: Bearer …).
 * Schedule is defined in `vercel.json`.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
