import Link from "next/link";

function RoleCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6 hover:border-slate-400/60 transition"
    >
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-2 text-xs text-slate-400 leading-relaxed">{desc}</div>
      <div className="mt-4 text-xs font-semibold text-slate-200">进入 →</div>
    </Link>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="text-xs font-semibold tracking-wide text-slate-400">
          企业 AI 效能中枢（AI‑CoE）Demo
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">三端一体化入口</h1>
        <p className="mt-3 text-sm text-slate-400">
          演示版：先跑通“员工端工作台 → 产物输出 → 审计 → 老板端指标（近7天强脱敏）”。
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <RoleCard
            title="员工端（WorkBench）"
            desc="业务岛 + 工作流卡片：一键出商品详情图/产品画册/客户业务理解清单。"
            href="/employee/workbench"
          />
          <RoleCard
            title="老板端（Dashboard）"
            desc="近7天：成本 / 产量 / 风险。审计回放为强脱敏摘要。"
            href="/boss/dashboard"
          />
          <RoleCard
            title="顾问端（Console）"
            desc="模板库 / DLP 规则 / Mock 产品库（Demo 版配置后台）。"
            href="/console"
          />
        </div>

        <div className="mt-10 text-xs text-slate-500">
          说明：此页面不做真实鉴权，后续接入组织/角色体系。
        </div>
      </div>
    </div>
  );
}
