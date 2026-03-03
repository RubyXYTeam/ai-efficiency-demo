import Link from "next/link";
import { getAudit } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BossAuditDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const { logId } = await params;
  const a = getAudit(logId);

  if (!a) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">老板端 · 审计详情（强脱敏）</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{a.workflowId}</h1>
            <div className="mt-2 text-sm text-slate-400">
              {a.createdAt} · {a.dept} · {a.customerAlias}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/boss/audit"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
          <div className="text-xs text-slate-400">输入摘要</div>
          <div className="mt-2 text-sm text-slate-100">{a.inputSummary}</div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
          <div className="text-xs text-slate-400">输出摘要（主题级）</div>
          <div className="mt-2 text-sm text-slate-100 whitespace-pre-wrap">{a.outputSummary}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
            <div className="text-xs text-slate-400">成本</div>
            <div className="mt-2 text-xl font-bold">¥{a.costCny.toFixed(1)}</div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
            <div className="text-xs text-slate-400">档位</div>
            <div className="mt-2 text-xl font-bold">{a.qualityPreset}</div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
            <div className="text-xs text-slate-400">风险</div>
            <div className="mt-2 text-xl font-bold">{a.risky ? "⚠" : "OK"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
