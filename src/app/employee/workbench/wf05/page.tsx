"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-slate-300">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export default function Wf05Page() {
  const [customerName, setCustomerName] = useState("某高校生命科学学院");
  const [industry, setIndustry] = useState("高校/研究机构 · 生命科学仪器采购");
  const [visitRole, setVisitRole] = useState(
    "PI/课题组负责人 + 实验室管理员 + 设备处/招采"
  );
  const [visitGoal, setVisitGoal] = useState(
    "确认真实需求与评审标准，推进立项/试用，锁定决策链与时间表"
  );

  const [ourOffer, setOurOffer] = useState(
    "我们提供：生命科学仪器选型/方案设计/交付实施/培训维保；可提供样机试用、应用方案与标书支持。"
  );
  const [knownFacts, setKnownFacts] = useState(
    "预算不确定；偏好稳定交付与售后；需要符合招采流程与合规要求。"
  );
  const [constraints, setConstraints] = useState(
    "不编造客户事实；不输出底价；不输出客户敏感信息；对所有结论标注‘假设/需验证’。"
  );
  const [refLinks, setRefLinks] = useState("");
  const [quality, setQuality] = useState<"standard" | "hq">("hq");

  const [runId, setRunId] = useState<string | null>(null);
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canCopy = useMemo(() => md.trim().length > 0, [md]);

  async function run() {
    setLoading(true);
    setErr(null);
    setMd("");
    setRunId(null);

    try {
      const res = await fetch("/api/workflows/wf05_previsit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          industry,
          visit_role: visitRole,
          visit_goal: visitGoal,
          our_offer_one_liner: ourOffer,
          known_facts: knownFacts,
          reference_links: refLinks,
          constraints,
          quality_preset: quality,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setRunId(j.runId);

      const rr = await fetch(`/api/runs/${j.runId}`);
      const rj = await rr.json();
      if (!rr.ok) throw new Error(rj?.error || `HTTP ${rr.status}`);
      setMd(rj.markdown || "");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(md);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              员工端 · WF‑05（Demo）
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              售前拜访助手（更全版）
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              面向：高校/研究机构 · 生命科学仪器采购。输出可直接复制到飞书/邮件/CRM。
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employee/workbench"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回工作台
            </Link>
            <Link
              href="/boss/audit"
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
            >
              去老板端审计
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6 space-y-4">
            <Field label="客户（机构）名称">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="行业/客户类型（可选）">
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="拜访对象角色（可选）">
              <input
                value={visitRole}
                onChange={(e) => setVisitRole(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="本次目标（可选）">
              <input
                value={visitGoal}
                onChange={(e) => setVisitGoal(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="我方能力一句话（可选）">
              <textarea
                value={ourOffer}
                onChange={(e) => setOurOffer(e.target.value)}
                className="w-full min-h-20 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="已知信息（可选）">
              <textarea
                value={knownFacts}
                onChange={(e) => setKnownFacts(e.target.value)}
                className="w-full min-h-20 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="参考链接（可选，先手工贴；V1 不做自动检索）">
              <textarea
                placeholder="每行一个链接（官网/学院主页/采购公告/招标文件等）"
                value={refLinks}
                onChange={(e) => setRefLinks(e.target.value)}
                className="w-full min-h-16 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="约束/禁区（可选）">
              <textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="w-full min-h-16 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>档位：</span>
                <button
                  onClick={() => setQuality("standard")}
                  className={`rounded-lg border px-2.5 py-1.5 transition ${
                    quality === "standard"
                      ? "border-slate-300 bg-slate-100 text-slate-900"
                      : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
                  }`}
                >
                  标准
                </button>
                <button
                  onClick={() => setQuality("hq")}
                  className={`rounded-lg border px-2.5 py-1.5 transition ${
                    quality === "hq"
                      ? "border-slate-300 bg-slate-100 text-slate-900"
                      : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
                  }`}
                >
                  高质
                </button>
              </div>

              <button
                disabled={loading}
                onClick={run}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
              >
                {loading ? "生成中…" : "生成拜访方案"}
              </button>
            </div>

            {err ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                生成失败：{err}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">输出（Markdown）</div>
                <div className="mt-1 text-xs text-slate-400">runId：{runId || "-"}</div>
              </div>
              <button
                disabled={!canCopy}
                onClick={copy}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition disabled:opacity-50"
              >
                一键复制
              </button>
            </div>

            <pre className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-200 rounded-xl border border-slate-800 bg-slate-950/30 p-4 min-h-[420px]">
              {md || "（尚未生成）"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
