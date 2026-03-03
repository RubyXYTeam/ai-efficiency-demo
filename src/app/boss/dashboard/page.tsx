import Link from "next/link";

export default function BossDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">老板端 · 效能座舱</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">近7天概览（强脱敏）</h1>
            <p className="mt-2 text-sm text-slate-400">成本 / 产量 / 风险（Demo骨架）</p>
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
            <div className="mt-2 text-2xl font-bold">—</div>
            <div className="mt-2 text-xs text-slate-400">按部门 / 标准vs高质（后续接入）</div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="text-xs text-slate-400">7天产量</div>
            <div className="mt-2 text-2xl font-bold">—</div>
            <div className="mt-2 text-xs text-slate-400">WF-01/WF-02/WF-04+ 运行次数</div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="text-xs text-slate-400">7天风险</div>
            <div className="mt-2 text-2xl font-bold">—</div>
            <div className="mt-2 text-xs text-slate-400">DLP 命中、异常用量</div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5 text-xs text-slate-400">
          下一步：接入 /api/audit 数据聚合，展示部门排行、审计主题趋势。
        </div>
      </div>
    </div>
  );
}
