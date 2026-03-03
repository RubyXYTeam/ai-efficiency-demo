import Link from "next/link";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              顾问端 · Console（管理平台 Demo）
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              配置与治理
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              先把管理平台框架搭齐：产品库 / 风控规则 / 模板库（后续再做权限与持久化）。
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-4">
            <div className="text-xs font-semibold text-slate-300 px-2 py-2">
              导航
            </div>
            <nav className="mt-2 space-y-2">
              <Link
                href="/console/products"
                className="block rounded-xl border border-slate-700 bg-transparent px-3 py-2 text-sm hover:border-slate-400 transition"
              >
                Mock 产品库
              </Link>
              <Link
                href="/console/dlp"
                className="block rounded-xl border border-slate-700 bg-transparent px-3 py-2 text-sm hover:border-slate-400 transition"
              >
                风控规则（DLP）
              </Link>
              <Link
                href="/console/templates"
                className="block rounded-xl border border-slate-700 bg-transparent px-3 py-2 text-sm hover:border-slate-400 transition"
              >
                模板库
              </Link>
            </nav>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-400">
              Demo 说明：当前为内存态配置，重启会丢。下一步接 sqlite/json。
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
