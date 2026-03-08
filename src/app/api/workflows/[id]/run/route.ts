import { NextResponse } from "next/server";
import { addAudit, createRun, getCustomerAlias, updateRun } from "@/lib/store";
import { dlpScan } from "@/lib/dlp";
import { getWorkflow, renderTemplate } from "@/lib/workflows";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wf = getWorkflow(id);
  if (!wf) return NextResponse.json({ error: "workflow not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const vars: Record<string, string> = {};
  for (const f of wf.inputs || []) {
    vars[f.key] = String(body[f.key] ?? f.defaultValue ?? "");
  }

  const run = createRun("wf05_previsit"); // reuse run infra; workflowId is for metrics only
  updateRun(run.id, { status: "running" });

  const alias = getCustomerAlias(vars.customer || wf.name);
  const inputSummary = `${alias}｜${wf.name}`;

  try {
    const md = renderTemplate(wf.templateMarkdown, vars);
    const outputSummary = (md || "").slice(0, 200);

    const hits = dlpScan([wf.name, JSON.stringify(vars), md].join("\n\n"));
    const risky = hits.some((h) => h.severity === "high") || hits.length >= 3;

    const audit = addAudit({
      workflowId: "wf05_previsit",
      dept: "销售部",
      actor: "demo-user",
      qualityPreset: "standard",
      costCny: 0.1,
      inputSummary,
      outputSummary,
      customerAlias: alias,
      risky,
      dlpHits: hits,
    });

    updateRun(run.id, {
      status: "succeeded",
      markdown: md,
      artifactType: "text",
      auditLogId: audit.id,
    });

    return NextResponse.json({ ok: true, runId: run.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    updateRun(run.id, { status: "failed", error: msg });
    return NextResponse.json({ error: msg, runId: run.id }, { status: 500 });
  }
}
