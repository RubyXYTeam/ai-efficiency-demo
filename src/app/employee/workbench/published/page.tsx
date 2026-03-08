"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type W = { id: string; name: string; desc: string; tags: string[] };

export default function PublishedWorkbenchPage() {
  const [ws, setWs] = useState<W[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/workflows/published");
      const j = await res.json();
      setWs((j.workflows || []) as W[]);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">员工端 · 已发布工作流</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">工作流卡片（动态）</h1>
            <p className="mt-2 text-sm text-slate-400">来自 Console「工作流发布台」的已发布工作流。</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employee/workbench"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回工作台
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ws.map((w) => (
            <Link
              key={w.id}
              href={`/employee/workbench/w/${encodeURIComponent(w.id)}`}
              className="block rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6 hover:border-slate-400/60 transition"
            >
              <div className="text-sm font-semibold text-slate-100">{w.name}</div>
              <div className="mt-2 text-xs text-slate-400 leading-relaxed">{w.desc}</div>
              <div className="mt-3 text-[11px] text-slate-500">{(w.tags || []).join(" · ")}</div>
              <div className="mt-4 text-xs font-semibold text-slate-200">打开 →</div>
            </Link>
          ))}
          {!ws.length ? (
            <div className="text-sm text-slate-400">暂无已发布工作流。请去 Console 发布。</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
