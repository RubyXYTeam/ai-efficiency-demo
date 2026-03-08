"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Product = { id: string; name: string };

type Run = {
  id: string;
  createdAt: string;
  status: "queued" | "running" | "succeeded" | "failed";
  artifactUrl?: string;
  error?: string;
};

function History({ workflowId }: { workflowId: string }) {
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/runs?workflowId=${encodeURIComponent(workflowId)}&limit=20`);
      const j = await res.json();
      const list = (j?.runs || []) as Run[];
      if (alive) setRuns(list);
    })();
    return () => {
      alive = false;
    };
  }, [workflowId]);

  if (!runs.length) return <div className="mt-3 text-xs text-slate-400">（暂无）</div>;

  return (
    <div className="mt-3 space-y-2">
      {runs.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400">{r.createdAt}</div>
              <div className="mt-1 text-xs text-slate-200">{r.id}</div>
            </div>
            <div className="text-xs font-semibold text-slate-200">{r.status}</div>
          </div>
          {r.artifactUrl ? (
            <a className="mt-2 inline-block text-xs text-slate-100 underline" href={r.artifactUrl} target="_blank" rel="noreferrer">
              打开产物
            </a>
          ) : null}
          {r.error ? <div className="mt-2 text-xs text-red-200">{r.error}</div> : null}
        </div>
      ))}
    </div>
  );
}

export default function Wf02Page() {
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
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
      const list: Product[] = (j.products || []).map((p: unknown) => {
        const x = p as { id?: unknown; name?: unknown };
        return { id: String(x.id || ""), name: String(x.name || "") };
      });
      setProducts(list);
      if (list?.[0]?.id) setProductId(list[0].id);
    })();
  }, []);

  async function run() {
    setLoading(true);
    setErr(null);
    setUrl(null);
    setRunId(null);

    try {
      const res = await fetch("/api/workflows/wf02/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const raw = await res.text();
      let j: unknown = null;
      try {
        j = raw ? JSON.parse(raw) : null;
      } catch {
        // ignore
      }

      const jj = (j as { error?: unknown; runId?: unknown } | null) || null;
      if (!res.ok) throw new Error(String(jj?.error || raw || `HTTP ${res.status}`));

      const rid = String(jj?.runId || "");
      setRunId(rid);

      // Poll status until done
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const rr = await fetch(`/api/runs/${rid}`);
        const rj = await rr.json();
        const rjj = rj as { error?: unknown };
        if (!rr.ok) throw new Error(String(rjj?.error || `HTTP ${rr.status}`));

        if (rj.status === "succeeded") {
          setUrl(String(rj.artifactUrl || ""));
          return;
        }
        if (rj.status === "failed") {
          throw new Error(String(rj.error || "生成失败"));
        }
      }

      throw new Error("生成超时：仍在处理中（可稍后在老板端审计或刷新本页查看）");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              员工端 · WF‑02（Demo）
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              产品画册（PDF）
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              先跑通“固定6页结构 → 一键生成 → 下载/预览”。文案从顾问端 Console 的 Mock 产品库读取。
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employee/workbench"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回
            </Link>
            <Link
              href="/console"
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
            >
              去Console改文案
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
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

          <button
            disabled={loading}
            onClick={run}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
          >
            {loading ? "生成中…" : "生成PDF"}
          </button>
          {err ? <div className="text-xs text-red-200">失败：{err}</div> : null}
          <div className="text-xs text-slate-400">runId：{runId || "-"}</div>
        </div>

        {url ? (
          <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="text-sm font-semibold">产物已生成</div>
            <div className="mt-2 text-xs text-slate-400">{url}</div>
            <div className="mt-4 flex gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
              >
                打开/下载
              </a>
              <a
                href={url}
                download
                className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold hover:border-slate-400 transition"
              >
                直接下载
              </a>
            </div>
            <iframe
              src={url}
              className="mt-6 h-[70vh] w-full rounded-xl border border-slate-800 bg-black"
              title="wf02-pdf"
            />
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
          <div className="text-sm font-semibold">历史记录（最近20条）</div>
          <div className="mt-1 text-xs text-slate-400">你可以离开页面，稍后回来查看生成结果。</div>
          <History workflowId="wf02_catalog_pdf" />
        </div>
      </div>
    </div>
  );
}
