import { NextResponse } from "next/server";
import { aifastChatCompletion } from "@/lib/aifast";
import { addAudit, createRun, getCustomerAlias, updateRun } from "@/lib/store";
import { dlpScan } from "@/lib/dlp";

export const runtime = "nodejs";

type Req = {
  customer_name: string;
  industry?: string;
  visit_role?: string;
  visit_goal?: string;
  our_offer_one_liner?: string;
  known_facts?: string;
  reference_links?: string;
  constraints?: string;
  quality_preset: "standard" | "hq";
};

function summarize(text: string, max = 180) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function normalizeLinks(raw?: string) {
  const lines = (raw || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  // keep only http(s) links (demo safety)
  const links = lines.filter((l) => /^https?:\/\//i.test(l));
  return links.slice(0, 8);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Req;

  const run = createRun("wf05_previsit");
  updateRun(run.id, { status: "running" });

  const alias = getCustomerAlias(body.customer_name);

  const inputSummary = `${alias}｜行业：${summarize(body.industry || "-", 40)}｜对象：${summarize(body.visit_role || "-", 40)}｜目标：${summarize(body.visit_goal || "-", 40)}`;

  // Demo cost model
  const costCny = body.quality_preset === "hq" ? 3.5 : 1.5;

  const links = normalizeLinks(body.reference_links);

  const system =
    "你是资深B2B售前解决方案咨询顾问，擅长高校/研究机构的生命科学仪器采购场景。" +
    "输出必须可稳定交付、可执行、结构化（Markdown）。" +
    "严禁编造客户事实；所有判断要标注‘假设/需验证’；把不确定的写成‘待验证问题’。";

  const user = `客户/机构：${body.customer_name}
行业/类型：${body.industry || ""}
拜访对象角色：${body.visit_role || ""}
本次目标：${body.visit_goal || ""}
我方能力一句话：${body.our_offer_one_liner || ""}
已知信息：${body.known_facts || ""}
参考链接（若有）：${links.join("\n")}
约束/禁区：${body.constraints || ""}

请输出一份“售前拜访方案（更全版）”，Markdown 结构必须包含且按顺序输出：

A) 1分钟业务理解（<=12条要点）：业务结构/关键指标/采购动机/场景假设（明确标注假设）
B) 关键角色与决策链（高校/研究机构常见）：PI/课题组、实验室管理员、设备处/招采、财务、评审专家（每个角色写：关注点+风险点+我方策略）
C) 需求与评审标准假设：列出“需求假设Top10 + 对应验证方式”
D) 竞品与替代方案清单：列出>=8项（含‘现有设备升级/委外服务/租赁’等替代），并写我们如何定位差异（写成需验证项）
E) 拜访提问清单（分角色）：至少20问，每问写‘目的/拿到什么信息才算有效’
F) 话术脚本：开场3句、探需5句、价值呈现5句、异议处理（至少6类常见异议）、收尾与下一步（含时间表）
G) 会后纪要模板（可复制）：背景/参与人/现状/需求/方案/风险/下一步行动项（行动项要表格或列表：事项-负责人-截止时间-依赖）
H) CRM 更新字段建议：至少12个字段（含阶段、预算、决策人、评审标准、竞品、下一步等）
I) 未知项/需验证清单（>=12条）
J) 合规与禁区（>=8条）：尤其注意招采合规、价格、承诺、数据与隐私

风格要求：专业但极简；每段结尾给一个“下一步建议”。`;

  try {
    const j = await aifastChatCompletion(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      undefined
    );

    const md: string = j?.choices?.[0]?.message?.content || "";
    const outputSummary = summarize(md, 220);

    const hits = dlpScan(
      [
        body.customer_name,
        body.industry,
        body.visit_role,
        body.visit_goal,
        body.our_offer_one_liner,
        body.known_facts,
        body.reference_links,
        body.constraints,
        md,
      ]
        .filter(Boolean)
        .join("\n\n")
    );
    const risky = hits.some((h) => h.severity === "high") || hits.length >= 3;

    const audit = addAudit({
      workflowId: "wf05_previsit",
      dept: "销售部",
      actor: "demo-user",
      qualityPreset: body.quality_preset,
      costCny,
      inputSummary,
      outputSummary,
      customerAlias: alias,
      risky,
      dlpHits: hits,
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
      workflowId: "wf05_previsit",
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
