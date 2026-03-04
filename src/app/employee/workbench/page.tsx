import Link from "next/link";

function Card({
  title,
  desc,
  href,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6 hover:border-slate-400/60 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        {badge ? (
          <span className="rounded-full border border-slate-700/60 bg-slate-950/30 px-2.5 py-1 text-[11px] text-slate-300">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-xs text-slate-400 leading-relaxed">{desc}</div>
      <div className="mt-4 text-xs font-semibold text-slate-200">打开 →</div>
    </Link>
  );
}

export default function WorkbenchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              员工端 · 业务岛工作台
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              工作流（Demo）
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              目标：一键产出可下载交付物，并全程可审计（成本/风险/产量）。
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card
            title="WF‑01 一键出商品详情图"
            desc="同一份产品信息，一键生成 T1/T2/T3 三套风格（主图/四宫格/卖点页）。"
            href="/employee/workbench/wf01"
            badge="Image"
          />
          <Card
            title="WF‑02 产品画册（PDF）"
            desc="6页固定结构：封面/概览/卖点/场景/注意事项/话术页。先只做PDF。"
            href="/employee/workbench/wf02"
            badge="PDF"
          />
          <Card
            title="WF‑04+ 客户业务理解（1分钟清单）"
            desc="输入客户名+部门 → 输出“必问十问/决策链路/价值映射/未知项”。默认 Markdown，一键复制。"
            href="/employee/workbench/wf04"
            badge="Text"
          />
          <Card
            title="WF‑05 售前拜访助手（更全版）"
            desc="高校/研究机构 · 生命科学仪器采购：业务理解→竞品替代→目标拆解→分角色提问→话术→纪要+CRM。"
            href="/employee/workbench/wf05"
            badge="Text"
          />
          <Card
            title="WF‑06 产品宣传片（15秒）"
            desc="输入产品卖点 → 自动生成 15 秒 16:9 科技插画风宣传片（可预览/下载，写审计）。"
            href="/employee/workbench/wf06"
            badge="Video"
          />
        </div>

        <div className="mt-10 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5 text-xs text-slate-400">
          说明：此页先完成 UI 骨架。下一步接入：工作流 runId、状态、产物预览与下载。
        </div>
      </div>
    </div>
  );
}
