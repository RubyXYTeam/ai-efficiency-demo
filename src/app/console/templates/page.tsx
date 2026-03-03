import Link from "next/link";

export default function ConsoleTemplatesPage() {
  const templates = [
    { id: "wf01", name: "WF‑01 商品详情图模板（T1/T2/T3）", status: "ready" },
    { id: "wf02", name: "WF‑02 画册 PDF（6页固定结构）", status: "ready" },
    { id: "wf04", name: "WF‑04+ 客户业务理解（Markdown）", status: "ready" },
  ];

  return (
    <div>
      <div className="text-sm font-semibold">模板库</div>
      <div className="mt-1 text-xs text-slate-400">
        先完成目录与入口。后续再做：模板参数化、版本管理、预览与回滚。
      </div>

      <div className="mt-6 space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 flex items-start justify-between gap-4"
          >
            <div>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="mt-1 text-xs text-slate-400">status: {t.status}</div>
            </div>
            <div className="flex gap-2">
              {t.id === "wf01" ? (
                <Link
                  href="/employee/workbench/wf01"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                >
                  打开
                </Link>
              ) : null}
              {t.id === "wf02" ? (
                <Link
                  href="/employee/workbench/wf02"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                >
                  打开
                </Link>
              ) : null}
              {t.id === "wf04" ? (
                <Link
                  href="/employee/workbench/wf04"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                >
                  打开
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
