"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
};

type Workflow = {
  id: string;
  name: string;
  desc: string;
  inputs: Field[];
  templateMarkdown: string;
};

export default function DynamicWorkflowPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [wf, setWf] = useState<Workflow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [runId, setRunId] = useState<string | null>(null);
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/console/workflows/${encodeURIComponent(id)}`);
      const j = await res.json();
      const w = (j.workflow || null) as Workflow | null;
      setWf(w);
      if (w) {
        const init: Record<string, string> = {};
        for (const f of w.inputs || []) init[f.key] = f.defaultValue || "";
        setForm(init);
      }
    })();
  }, [id]);

  const canCopy = useMemo(() => md.trim().length > 0, [md]);

  async function run() {
    if (!wf) return;
    setLoading(true);
    setErr(null);
    setMd("");
    setRunId(null);

    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(wf.id)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(String(j?.error || `HTTP ${res.status}`));
      setRunId(String(j.runId || ""));

      // fetch output
      const rr = await fetch(`/api/runs/${j.runId}`);
      const rj = await rr.json();
      if (!rr.ok) throw new Error(String(rj?.error || `HTTP ${rr.status}`));
      setMd(String(rj.markdown || ""));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(md);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">员工端 · 动态工作流</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{wf?.name || "加载中…"}</h1>
            <p className="mt-2 text-sm text-slate-400">{wf?.desc || ""}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employee/workbench/published"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
            >
              ← 返回已发布
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
            {(wf?.inputs || []).map((f) => (
              <label key={f.key} className="block">
                <div className="text-xs font-semibold text-slate-300">{f.label}</div>
                <div className="mt-2">
                  {f.type === "textarea" ? (
                    <textarea
                      value={form[f.key] || ""}
                      placeholder={f.placeholder || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full min-h-20 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                    >
                      {(f.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form[f.key] || ""}
                      placeholder={f.placeholder || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                    />
                  )}
                </div>
              </label>
            ))}

            <button
              disabled={loading}
              onClick={run}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
            >
              {loading ? "生成中…" : "生成"}
            </button>

            {err ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                {err}
              </div>
            ) : null}

            <div className="text-xs text-slate-400">runId：{runId || "-"}</div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">输出（Markdown）</div>
                <div className="mt-1 text-xs text-slate-400">可复制发群/发邮件</div>
              </div>
              <button
                disabled={!canCopy}
                onClick={copy}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition disabled:opacity-50"
              >
                一键复制
              </button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-200 rounded-xl border border-slate-800 bg-slate-950/30 p-4 min-h-[420px]">
              {md || "（尚未生成）"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
