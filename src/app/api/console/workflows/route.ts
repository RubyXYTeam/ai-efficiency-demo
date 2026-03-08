import { NextResponse } from "next/server";
import { ensureSeedDeirWorkflow, listWorkflows, upsertWorkflow } from "@/lib/workflows";

export const runtime = "nodejs";

export async function GET() {
  ensureSeedDeirWorkflow();
  return NextResponse.json({ workflows: listWorkflows() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const wf = upsertWorkflow(body || {});
    return NextResponse.json({ workflow: wf });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
