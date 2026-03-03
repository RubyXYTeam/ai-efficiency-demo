"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  name: string;
  severity: "low" | "med" | "high";
  enabled: boolean;
  patterns: string[];
};

export default function ConsoleDlpPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/console/dlp");
      const j = await res.json();
      setRules(j.rules || []);
    })();
  }, []);

  async function toggle(id: string, enabled: boolean) {
    setMsg("");
    const res = await fetch("/api/console/dlp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j?.error || `HTTP ${res.status}`);
      return;
    }
    setRules(j.rules || []);
  }

  return (
    <div>
      <div className="text-sm font-semibold">风控规则（DLP）</div>
      <div className="mt-1 text-xs text-slate-400">
        先完成“管理平台可配置”闭环：这里开关规则，WF‑04+ 会扫描并把命中写入审计。
      </div>
      {msg ? <div className="mt-2 text-xs text-red-200">{msg}</div> : null}

      <div className="mt-6 space-y-2">
        {rules.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 flex items-start justify-between gap-4"
          >
            <div>
              <div className="text-sm font-semibold">{r.name}</div>
              <div className="mt-1 text-xs text-slate-400">
                severity: {r.severity} · patterns: {r.patterns.join(" / ")}
              </div>
            </div>
            <button
              onClick={() => toggle(r.id, !r.enabled)}
              className={`text-xs rounded-lg border px-3 py-2 font-semibold transition ${
                r.enabled
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300/60"
                  : "border-slate-700 bg-transparent text-slate-300 hover:border-slate-400"
              }`}
            >
              {r.enabled ? "已启用" : "未启用"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-xs text-slate-400">
        下一步（依次）：把同样的扫描接到 WF‑01/WF‑02，并在老板端风险卡展示“规则命中数”。
      </div>
    </div>
  );
}
