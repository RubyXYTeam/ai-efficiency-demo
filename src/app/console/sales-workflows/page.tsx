"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; title: string };

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Minimal Markdown -> HTML (headings, bullets, code blocks, bold, links)
function mdToHtml(md: string) {
  const lines = md.split(/\r?\n/);
  let html = "";
  let inCode = false;
  for (const raw of lines) {
    const line = raw || "";
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      html += inCode
        ? `<pre class=\"mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 overflow-auto\"><code>`
        : `</code></pre>`;
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + "\n";
      continue;
    }

    if (/^#\s+/.test(line)) {
      html += `<h1 class=\"mt-4 text-xl font-bold\">${escapeHtml(line.replace(/^#\s+/, ""))}</h1>`;
      continue;
    }
    if (/^##\s+/.test(line)) {
      html += `<h2 class=\"mt-4 text-lg font-bold\">${escapeHtml(line.replace(/^##\s+/, ""))}</h2>`;
      continue;
    }
    if (/^###\s+/.test(line)) {
      html += `<h3 class=\"mt-4 text-base font-bold\">${escapeHtml(line.replace(/^###\s+/, ""))}</h3>`;
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      // start list if previous isn't list
      if (!html.endsWith("</li>")) {
        // noop
      }
      // naive: wrap each bullet in its own ul to keep simple
      html += `<ul class=\"mt-2 list-disc pl-5 text-sm text-slate-200\"><li>${escapeHtml(line.replace(/^\s*-\s+/, ""))}</li></ul>`;
      continue;
    }

    if (!line.trim()) {
      html += `<div class=\"h-2\"></div>`;
      continue;
    }

    let p = escapeHtml(line);
    // bold
    p = p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // links
    p = p.replace(
      /(https?:\/\/[^\s)]+)/g,
      '<a class="underline" href="$1" target="_blank" rel="noreferrer">$1</a>'
    );

    html += `<p class=\"mt-2 text-sm leading-relaxed text-slate-200\">${p}</p>`;
  }
  return html;
}

export default function SalesWorkflowsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<Item | null>(null);
  const [md, setMd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/console/sales-workflows");
      const j = await res.json();
      const list = (j.workflows || []) as Item[];
      setItems(list);
      if (list[0]) setActive(list[0]);
    })();
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setErr(null);
    setMd("");
    (async () => {
      try {
        const res = await fetch(`/api/console/sales-workflows/${encodeURIComponent(active.id)}`);
        const j = await res.json();
        if (!res.ok) throw new Error(String(j?.error || `HTTP ${res.status}`));
        setMd(String(j.md || ""));
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [active]);

  const html = useMemo(() => mdToHtml(md), [md]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">售前工作流库（Markdown）</div>
          <div className="mt-1 text-xs text-slate-400">
            目标：把团队共创的售前方法论沉淀成可维护的资产（后续可一键下发到员工端工作流）。
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs font-semibold text-slate-300">文档</div>
          <div className="mt-3 space-y-2">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => setActive(it)}
                className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${
                  active?.id === it.id
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
                }`}
              >
                {it.title}
              </button>
            ))}
            {!items.length ? (
              <div className="text-xs text-slate-400">（暂无文档）</div>
            ) : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
          {loading ? <div className="text-xs text-slate-400">加载中…</div> : null}
          {err ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {err}
            </div>
          ) : null}

          {md ? (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : !loading ? (
            <div className="text-xs text-slate-400">请选择左侧文档。</div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
