import { NextResponse } from "next/server";
import { aifastChatCompletion } from "@/lib/aifast";
import { addAudit, createRun, getCustomerAlias, updateRun } from "@/lib/store";

export const runtime = "nodejs";

type Req = {
  customer_name: string;
  customer_dept: string;
  visit_role?: string;
  our_offer_one_liner: string;
  known_facts?: string;
  constraints?: string;
  quality_preset: "standard" | "hq";
};

function summarize(text: string, max = 180) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Req;

  const run = createRun("wf04_customer_brief");
  updateRun(run.id, { status: "running" });

  const alias = getCustomerAlias(body.customer_name);

  const inputSummary = `${alias}｜部门：${body.customer_dept}｜对象：${body.visit_role || "-"}｜我方：${summarize(body.our_offer_one_liner, 80)}`;

  // Demo cost model
  const costCny = body.quality_preset === "hq" ? 2.5 : 1.0;

  const system =
    "你是资深ToB售前解决方案顾问。输出一份1页客户业务理解清单（Markdown）。不得编造事实，必须明确标注‘假设/需验证项’。";

  const user = `客户：${body.customer_name}\n部门：${body.customer_dept}\n拜访对象角色：${body.visit_role || ""}\n我方能力一句话：${body.our_offer_one_liner}\n已知信息：${body.known_facts || ""}\n约束/禁区：${body.constraints || ""}\n\n请输出Markdown，结构必须包含：\n1) 业务目标假设Top5（标注假设）\n2) 决策链路猜测（标注需验证）\n3) 典型痛点Top6\n4) 必问十问（每问写验证目的）\n5) 价值映射（痛点->我方价值->证据/资产）\n6) 未知项/需验证项（>=8条）\n7) 红线与禁区（>=5条）\n\n要求：极简、可复制、不要长篇大论。`;

  try {
    const j = await aifastChatCompletion(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // Demo: we keep using env model
      undefined
    );

    const md: string = j?.choices?.[0]?.message?.content || "";

    const outputSummary = summarize(md, 200);

    const audit = addAudit({
      workflowId: "wf04_customer_brief",
      dept: "销售部",
      actor: "demo-user",
      qualityPreset: body.quality_preset,
      costCny,
      inputSummary,
      outputSummary,
      customerAlias: alias,
      risky: false,
    });

    updateRun(run.id, {
      status: "succeeded",
      markdown: md,
      auditLogId: audit.id,
    });

    return NextResponse.json({ runId: run.id });
  } catch (e: any) {
    const msg = e?.message || String(e);
    updateRun(run.id, { status: "failed", error: msg });
    const audit = addAudit({
      workflowId: "wf04_customer_brief",
      dept: "销售部",
      actor: "demo-user",
      qualityPreset: body.quality_preset,
      costCny,
      inputSummary,
      outputSummary: "生成失败（已脱敏）",
      customerAlias: alias,
      risky: false,
    });
    updateRun(run.id, { auditLogId: audit.id });
    return NextResponse.json({ runId: run.id, error: msg }, { status: 500 });
  }
}
