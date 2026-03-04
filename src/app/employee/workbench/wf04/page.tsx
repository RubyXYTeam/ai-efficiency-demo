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

export default function Wf04Page() {
  const [customerName, setCustomerName] = useState("农业银行");
  const [customerDept, setCustomerDept] = useState("普惠金融部");
  const [visitRole, setVisitRole] = useState("部门负责人/业务总监");
  const [offer, setOffer] = useState(
    "我们提供：销售提效工作流（获客内容/拜访清单/画册）+ 组织级审计与成本预算。"
  );
  const [knownFacts, setKnownFacts] = useState("");
  const [constraints, setConstraints] = useState("不承诺效果，不给底价，不输出客户敏感信息。");
  const [quality, setQuality] = useState<"standard" | "hq">("standard");

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
      const res = await fetch("/api/workflows/wf04_customer_brief/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_dept: customerDept,
          visit_role: visitRole,
          our_offer_one_liner: offer,
          known_facts: knownFacts,
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
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
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
              员工端 · WF‑04+（Demo）
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              客户业务理解（1分钟清单）
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              输出 Markdown，可一键复制。老板端仅看强脱敏摘要。
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
            <Field label="客户公司名">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="部门">
              <input
                value={customerDept}
                onChange={(e) => setCustomerDept(e.target.value)}
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
            <Field label="我方能力一句话">
              <textarea
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                className="w-full min-h-24 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="已知信息（可选）">
              <textarea
                value={knownFacts}
                onChange={(e) => setKnownFacts(e.target.value)}
                className="w-full min-h-20 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
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
                {loading ? "生成中…" : "生成清单"}
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

            <pre className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-200 rounded-xl border border-slate-800 bg-slate-950/30 p-4 min-h-[360px]">
              {md || "（尚未生成）"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
