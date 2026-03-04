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

export default function ConsoleTemplatesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("p_liquid_fert_20kg");

  const [quality, setQuality] = useState<"standard" | "hq">("standard");
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  const activeProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/console/products");
      const j = await res.json();
      setProducts(j.products || []);
      if (j.products?.[0]?.id) setProductId(j.products[0].id);
    })();
  }, []);

  async function runWf01() {
    setLoading("wf01");
    setMsg("");
    try {
      const res = await fetch("/api/workflows/wf01/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qualityPreset: quality, templateIds: ["T1", "T2", "T3"] }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setMsg(`WF‑01 已生成：${j.base}`);
    } catch (e: unknown) {
      setMsg(`WF‑01 失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  async function runWf02() {
    setLoading("wf02");
    setMsg("");
    try {
      const res = await fetch("/api/workflows/wf02/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setMsg(`WF‑02 已生成：${j.url}`);
    } catch (e: unknown) {
      setMsg(`WF‑02 失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">模板库（下发中心）</div>
          <div className="mt-1 text-xs text-slate-400">
            目标：从 Console 一键触发工作流，产物在员工端查看，审计/指标在老板端查看。
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/boss/audit"
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
          >
            去审计
          </Link>
          <Link
            href="/boss/dashboard"
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
          >
            去座舱
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
          <div className="text-xs font-semibold text-slate-300">参数</div>

          <label className="mt-4 block">
            <div className="text-xs font-semibold text-slate-300">产品</div>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 text-xs text-slate-400">
            当前：{activeProduct ? activeProduct.name : "-"}
          </div>

          <div className="mt-4 text-xs font-semibold text-slate-300">档位（WF‑01）</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setQuality("standard")}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                quality === "standard"
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
              }`}
            >
              标准
            </button>
            <button
              onClick={() => setQuality("hq")}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                quality === "hq"
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
              }`}
            >
              高质
            </button>
          </div>

          {msg ? (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/30 p-3 text-xs text-slate-200">
              {msg}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
          <div className="text-xs font-semibold text-slate-300">模板列表</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
              <div className="text-sm font-semibold">WF‑01 商品详情图（T1/T2/T3）</div>
              <div className="mt-1 text-xs text-slate-400">
                生图 → 模板渲染 → 产物落地（并写审计）
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={runWf01}
                  disabled={loading === "wf01"}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
                >
                  {loading === "wf01" ? "生成中…" : "一键下发"}
                </button>
                <Link
                  href="/employee/workbench/wf01"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                >
                  打开员工端
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
              <div className="text-sm font-semibold">WF‑02 产品画册（PDF）</div>
              <div className="mt-1 text-xs text-slate-400">6页固定结构 → 预览/下载（并写审计）</div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={runWf02}
                  disabled={loading === "wf02"}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
                >
                  {loading === "wf02" ? "生成中…" : "一键下发"}
                </button>
                <Link
                  href="/employee/workbench/wf02"
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                >
                  打开员工端
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
              <div className="text-sm font-semibold">WF‑04+ 客户业务理解（Markdown）</div>
              <div className="mt-1 text-xs text-slate-400">先在员工端填信息生成（并写审计 + DLP）</div>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/employee/workbench/wf04"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
                >
                  打开员工端
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
              <div className="text-sm font-semibold">下一步</div>
              <div className="mt-1 text-xs text-slate-400">
                把 WF‑01 也支持选择 productId，并把“模板参数化/版本管理/回滚”接到这里。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
