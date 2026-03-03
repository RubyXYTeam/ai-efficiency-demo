import { NextResponse } from "next/server";
import { listDlpRules, setDlpRuleEnabled } from "@/lib/dlp";

export const runtime = "nodejs";

type PutReq = { id: string; enabled: boolean };

export async function GET() {
  return NextResponse.json({ rules: listDlpRules() });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as PutReq;
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const r = setDlpRuleEnabled(body.id, !!body.enabled);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, rule: r, rules: listDlpRules() });
}
