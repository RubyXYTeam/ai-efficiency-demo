import { NextResponse } from "next/server";
import { getWorkflow, setPublished, upsertWorkflow } from "@/lib/workflows";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wf = getWorkflow(id);
  if (!wf) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ workflow: wf });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const wf = upsertWorkflow({ ...(body || {}), id });
    return NextResponse.json({ workflow: wf });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // publish toggle endpoint: { published: boolean }
  const { id } = await params;
  try {
    const body = (await req.json().catch(() => ({}))) as { published?: boolean };
    const wf = setPublished(id, Boolean(body.published));
    return NextResponse.json({ workflow: wf });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
