import { NextResponse } from "next/server";
import { ensureSeedDeirWorkflow, listWorkflows } from "@/lib/workflows";

export const runtime = "nodejs";

export async function GET() {
  ensureSeedDeirWorkflow();
  const workflows = listWorkflows({ publishedOnly: true }).map((w) => ({
    id: w.id,
    name: w.name,
    desc: w.desc,
    tags: w.tags || [],
  }));
  return NextResponse.json({ workflows });
}
