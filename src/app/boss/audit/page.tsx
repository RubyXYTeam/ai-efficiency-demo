import Link from "next/link";
import { listAudits } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BossAuditPage() {
  const audits = listAudits();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">老板端 · 审计列表</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">近7天（强脱敏）</h1>
            <p className="mt-2 text-sm text-slate-400">仅展示摘要，不展示原文。</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/boss/dashboard"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回座舱
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {audits.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6 text-sm text-slate-400">
              暂无审计记录。先去员工端跑一次 WF‑04+。
            </div>
          ) : null}

          {audits.map((a) => (
            <Link
              key={a.id}
              href={`/boss/audit/${a.id}`}
              className="block rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5 hover:border-slate-400/60 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">{a.createdAt}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {a.workflowId} · {a.dept} · {a.customerAlias}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">输入：{a.inputSummary}</div>
                  <div className="mt-1 text-xs text-slate-300">输出摘要：{a.outputSummary}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">成本</div>
                  <div className="mt-1 text-sm font-bold">¥{a.costCny.toFixed(1)}</div>
                  <div className="mt-2 text-[11px] text-slate-400">{a.qualityPreset}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
