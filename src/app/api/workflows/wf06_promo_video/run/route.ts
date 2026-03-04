import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { addAudit, createRun, getCustomerAlias, updateRun } from "@/lib/store";
import { dlpScan } from "@/lib/dlp";
import { aifastVideoFromPrompt } from "@/lib/aifast-video";

export const runtime = "nodejs";

type Req = {
  product_name: string;
  one_liner: string;
  bullets?: string;
  audience?: string;
  brand_hint?: string;
  duration_seconds?: number;
  aspect_ratio?: "16:9" | "9:16";
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function nowId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function summarize(text: string, max = 200) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Req>;

  if (!body.product_name || !body.one_liner) {
    return NextResponse.json({ error: "product_name and one_liner required" }, { status: 400 });
  }

  const duration = Math.max(5, Math.min(60, Number(body.duration_seconds || 15)));
  const ratio = (body.aspect_ratio || "16:9") as "16:9" | "9:16";

  const run = createRun("wf06_promo_video");
  updateRun(run.id, { status: "running" });

  // Use product_name as alias seed (demo)
  const alias = getCustomerAlias(body.product_name);

  const bullets = (body.bullets || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const style =
    body.brand_hint ||
    "科技插画风（统一深色背景、简洁干净、无文字无水印、轻渐变、统一风格）";

  const prompt = `You are a creative director.
Generate a ${duration}s product promo video (mp4) in ${ratio}.
Style: ${style}.
No subtitles, no watermarks, no logos, no on-screen text.

Product: ${body.product_name}
One-liner: ${body.one_liner}
Key points:\n- ${bullets.join("\n- ") || "(none)"}
Target audience: ${body.audience || "(unspecified)"}

Deliverable: return either a mp4 URL or a data:video/mp4;base64,.... Only output the URL or the data url.`;

  const inputSummary = `${alias}｜${body.product_name}｜${duration}s ${ratio}｜${summarize(body.one_liner, 80)}`;

  try {
    const out = await aifastVideoFromPrompt(prompt);

    const outBase = path.join(process.cwd(), "public", "artifacts", "wf06", `${nowId()}_${ratio.replace(":", "x")}_${duration}s`);
    ensureDir(outBase);

    let url = "";
    if (out.kind === "base64") {
      const fileName = "promo.mp4";
      fs.writeFileSync(path.join(outBase, fileName), out.bytes);
      url = `/artifacts/wf06/${path.basename(outBase)}/${fileName}`;
    } else {
      // provider-hosted URL; just pass-through
      url = out.url;
    }

    const hits = dlpScan(
      [body.product_name, body.one_liner, body.bullets, body.audience, body.brand_hint]
        .filter(Boolean)
        .join("\n\n")
    );
    const risky = hits.some((h) => h.severity === "high") || hits.length >= 3;

    const audit = addAudit({
      workflowId: "wf06_promo_video",
      dept: "市场部",
      actor: "demo-user",
      qualityPreset: "hq",
      costCny: 9.9,
      inputSummary,
      outputSummary: `产物：${url.includes("/artifacts/") ? "promo.mp4" : "remote mp4"}`,
      customerAlias: alias,
      risky,
      dlpHits: hits,
    });

    updateRun(run.id, {
      status: "succeeded",
      markdown: `Video: ${url}`,
      auditLogId: audit.id,
    });

    return NextResponse.json({ ok: true, runId: run.id, url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    updateRun(run.id, { status: "failed", error: msg });

    const audit = addAudit({
      workflowId: "wf06_promo_video",
      dept: "市场部",
      actor: "demo-user",
      qualityPreset: "hq",
      costCny: 0,
      inputSummary,
      outputSummary: `失败（已脱敏）`,
      customerAlias: alias,
      risky: false,
    });
    updateRun(run.id, { auditLogId: audit.id });

    return NextResponse.json({ error: msg, runId: run.id }, { status: 500 });
  }
}
