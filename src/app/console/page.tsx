"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  subtitle: string;
  bullets: string[];
  gridLabels: [string, string, string, string];
  compliance: string;
};

export default function ConsolePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const active = useMemo(
    () => products.find((p) => p.id === activeId) || products[0] || null,
    [products, activeId]
  );

  const [draft, setDraft] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/console/products");
      const j = await res.json();
      setProducts(j.products || []);
      setActiveId(j.products?.[0]?.id || "");
    })();
  }, []);

  useEffect(() => {
    if (active) setDraft(active);
  }, [activeId, active]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/console/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const next = products.map((p) => (p.id === j.product.id ? j.product : p));
      setProducts(next);
      setMsg("已保存（内存态，重启会清空）");
    } catch (e: any) {
      setMsg(`保存失败：${e?.message || String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-black text-white p-10">loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              顾问端 · Console（Demo 配置后台）
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Mock 产品库
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              先把配置入口补齐：后续 WF‑01/WF‑02 统一从这里读取。
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
            <div className="text-xs font-semibold text-slate-300">产品列表</div>
            <div className="mt-3 space-y-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${
                    p.id === (activeId || products[0]?.id)
                      ? "border-slate-300 bg-slate-100 text-slate-900"
                      : "border-slate-700 bg-transparent text-slate-100 hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[11px] opacity-70">{p.id}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">编辑配置</div>
              <button
                disabled={saving}
                onClick={save}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
            {msg ? <div className="mt-2 text-xs text-slate-300">{msg}</div> : null}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-xs font-semibold text-slate-300">标题</div>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-slate-300">副标题</div>
                <input
                  value={draft.subtitle}
                  onChange={(e) =>
                    setDraft({ ...draft, subtitle: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <div className="text-xs font-semibold text-slate-300">卖点（最多 6 条）</div>
                <textarea
                  value={draft.bullets.join("\n")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      bullets: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 6),
                    })
                  }
                  className="mt-2 w-full min-h-28 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <div className="text-xs font-semibold text-slate-300">四宫格标签（4项，换行）</div>
                <textarea
                  value={draft.gridLabels.join("\n")}
                  onChange={(e) => {
                    const arr = e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .slice(0, 4);
                    const filled = [arr[0] || "A", arr[1] || "B", arr[2] || "C", arr[3] || "D"] as [
                      string,
                      string,
                      string,
                      string,
                    ];
                    setDraft({ ...draft, gridLabels: filled });
                  }}
                  className="mt-2 w-full min-h-20 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <div className="text-xs font-semibold text-slate-300">合规提示</div>
                <textarea
                  value={draft.compliance}
                  onChange={(e) =>
                    setDraft({ ...draft, compliance: e.target.value })
                  }
                  className="mt-2 w-full min-h-16 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">下一步</div>
              <ul className="mt-2 text-xs text-slate-300 list-disc pl-5 space-y-1">
                <li>把 WF‑01/WF‑02 的标题/卖点/标签全部改为读取此处配置</li>
                <li>持久化（sqlite/json）</li>
                <li>加 DLP 规则配置页</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
