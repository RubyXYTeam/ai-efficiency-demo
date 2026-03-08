import { NextResponse } from "next/server";
import { listRuns, type WorkflowId } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workflowId = (searchParams.get("workflowId") || "") as WorkflowId;
  const limit = Number(searchParams.get("limit") || "50");

  const runs = listRuns({
    workflowId: workflowId ? workflowId : undefined,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  return NextResponse.json({ runs });
}
