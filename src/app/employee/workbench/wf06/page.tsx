"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-slate-300">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export default function Wf06Page() {
  const [productName, setProductName] = useState("生命科学仪器 · 核心模块");
  const [oneLiner, setOneLiner] = useState("让实验更快更稳：从上样到结果，一键跑通，交付可追溯。");
  const [bullets, setBullets] = useState(
    "稳定交付：标准化SOP+培训\n数据可追溯：过程留痕\n省时省力：减少重复沟通与材料准备"
  );
  const [audience, setAudience] = useState("高校/研究机构：PI、实验室管理员、设备处/招采");
  const [brandHint, setBrandHint] = useState("科技插画风、统一深色背景、简洁无文字水印");

  const [runId, setRunId] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPreview = useMemo(() => !!url, [url]);

  async function run() {
    setLoading(true);
    setErr(null);
    setRunId(null);
    setUrl(null);

    try {
      const res = await fetch("/api/workflows/wf06_promo_video/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          one_liner: oneLiner,
          bullets,
          audience,
          brand_hint: brandHint,
          duration_seconds: 15,
          aspect_ratio: "16:9",
        }),
      });

      const raw = await res.text();
      let j: unknown = null;
      try {
        j = raw ? JSON.parse(raw) : null;
      } catch {
        // ignore
      }
      const jj = (j as { runId?: unknown; url?: unknown; error?: unknown } | null) || null;
      if (!res.ok) throw new Error(String(jj?.error || raw || `HTTP ${res.status}`));

      setRunId(String(jj?.runId || ""));
      setUrl(String(jj?.url || ""));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">员工端 · WF‑06（Demo）</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">产品宣传片（15秒 · 16:9）</h1>
            <p className="mt-2 text-sm text-slate-400">输出 MP4，可预览/下载，并写入老板端审计。</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employee/workbench"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回工作台
            </Link>
            <Link
              href="/boss/audit"
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
            >
              去老板端审计
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6 space-y-4">
            <Field label="产品名">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="一句话卖点">
              <input
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="核心卖点（每行一条）">
              <textarea
                value={bullets}
                onChange={(e) => setBullets(e.target.value)}
                className="w-full min-h-24 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="目标人群（可选）">
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="品牌/风格提示（可选）">
              <input
                value={brandHint}
                onChange={(e) => setBrandHint(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
              />
            </Field>

            <button
              disabled={loading}
              onClick={run}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
            >
              {loading ? "生成中…" : "生成宣传片"}
            </button>

            {err ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">失败：{err}</div>
            ) : null}

            <div className="text-xs text-slate-400">runId：{runId || "-"}</div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">输出（MP4）</div>
                <div className="mt-1 text-xs text-slate-400">{url || "（尚未生成）"}</div>
              </div>
              {url ? (
                <a
                  href={url}
                  className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                  download
                >
                  下载
                </a>
              ) : null}
            </div>

            {canPreview ? (
              <video
                className="mt-4 w-full rounded-xl border border-slate-800 bg-black"
                controls
                src={url!}
              />
            ) : (
              <div className="mt-4 text-xs text-slate-400">生成后可在此预览。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
