import Link from "next/link";
import { computeBossMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

function Num({ v, suffix }: { v: string; suffix?: string }) {
  return (
    <div className="mt-2 text-2xl font-bold">
      {v}
      {suffix ? <span className="text-sm font-semibold text-slate-300">{suffix}</span> : null}
    </div>
  );
}

export default function BossDashboardPage() {
  const m = computeBossMetrics(7);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">老板端 · 效能座舱</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">近7天概览（强脱敏）</h1>
            <p className="mt-2 text-sm text-slate-400">
              成本 / 产量 / 风险（Demo：从审计记录实时聚合）
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回
            </Link>
            <Link
              href="/boss/audit"
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
            >
              查看审计
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="text-xs text-slate-400">7天成本</div>
            <Num v={m.costTotalCny.toFixed(1)} suffix=" 元" />
            <div className="mt-2 text-xs text-slate-400">
              标准 ¥{m.costByPreset.standard.toFixed(1)} · 高质 ¥{m.costByPreset.hq.toFixed(1)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="text-xs text-slate-400">7天产量</div>
            <Num v={String(m.volumeTotal)} suffix=" 次" />
            <div className="mt-2 text-xs text-slate-400">
              {Object.entries(m.volumeByWorkflow)
                .map(([k, v]) => `${k} ${v}`)
                .join(" · ") || "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="text-xs text-slate-400">7天风险</div>
            <Num v={String(m.riskTotal)} suffix=" 点" />
            <div className="mt-2 text-xs text-slate-400">
              risky {m.riskBreakdown.riskyFlag} · fail {m.riskBreakdown.failedRuns} · highCost {m.riskBreakdown.highCostRuns}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
          <div className="text-sm font-semibold">7天走势（简版）</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {m.byDay.map((d) => (
              <div key={d.day} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="text-xs text-slate-400">{d.day}</div>
                <div className="mt-2 text-xs text-slate-300">成本 ¥{d.cost.toFixed(1)}</div>
                <div className="mt-1 text-xs text-slate-300">产量 {d.volume}</div>
                <div className="mt-1 text-xs text-slate-300">风险 {d.risk}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            说明：风险为 Demo 规则（riskyFlag/失败/高成本）叠加计数，后续替换为 DLP/异常用量/命中策略。
          </div>
        </div>
      </div>
    </div>
  );
}
