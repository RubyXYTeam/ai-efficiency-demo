"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
};

export default function Wf01Page() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("p_liquid_fert_20kg");

  const activeName = useMemo(
    () => products.find((p) => p.id === productId)?.name,
    [products, productId]
  );

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/console/products");
      const j = await res.json();
      const list = (j.products || []).map((p: any) => ({ id: p.id, name: p.name }));
      setProducts(list);
      if (list?.[0]?.id) setProductId(list[0].id);
    })();
  }, []);

  const [quality, setQuality] = useState<"standard" | "hq">("standard");

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/workflows/wf01/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          qualityPreset: quality,
          templateIds: ["T1", "T2", "T3"],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setData(j);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              员工端 · WF‑01（Demo）
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              一键出商品详情图（多模板）
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              当前版本：先用已生成素材做模板渲染，输出 T1/T2/T3 的 grid4 + benefits 成品图。
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employee/workbench"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>产品：</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/20 px-2.5 py-2 text-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="text-slate-500">{activeName ? `(${activeName})` : ""}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>档位：</span>
            <button
              onClick={() => setQuality("standard")}
              className={`rounded-lg border px-2.5 py-1.5 transition ${
                quality === "standard"
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
              }`}
            >
              标准
            </button>
            <button
              onClick={() => setQuality("hq")}
              className={`rounded-lg border px-2.5 py-1.5 transition ${
                quality === "hq"
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
              }`}
            >
              高质
            </button>
          </div>

          <button
            disabled={loading}
            onClick={run}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
          >
            {loading ? "生成中…" : "生成成品图"}
          </button>

          {err ? (
            <div className="text-xs text-red-200">失败：{err}</div>
          ) : (
            <div className="text-xs text-slate-400">输出目录：/public/artifacts/wf01/（按次生成）</div>
          )}
        </div>

        {data?.outputs?.length ? (
          <div className="mt-8 space-y-10">
            {data.outputs.map((o: any) => (
              <div key={o.templateId} className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-5">
                <div className="text-sm font-semibold">模板 {o.templateId}</div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">grid4</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="mt-2 w-full rounded-xl border border-slate-800" src={o.grid4} alt="grid4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">benefits</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="mt-2 w-full rounded-xl border border-slate-800" src={o.benefits} alt="benefits" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
