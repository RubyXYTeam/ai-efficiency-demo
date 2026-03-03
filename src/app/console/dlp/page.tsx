export default function ConsoleDlpPage() {
  const rules = [
    { id: "r1", name: "敏感词：底价/返点", severity: "high", enabled: true },
    { id: "r2", name: "个人信息：手机号/身份证", severity: "high", enabled: true },
    { id: "r3", name: "过度承诺：保证增产/保证收益", severity: "med", enabled: true },
    { id: "r4", name: "异常用量：短时间高频调用", severity: "med", enabled: false },
  ];

  return (
    <div>
      <div className="text-sm font-semibold">风控规则（DLP）</div>
      <div className="mt-1 text-xs text-slate-400">
        先做管理平台框架：规则列表 + 启用/禁用（Demo）。下一步把命中结果写入审计。
      </div>

      <div className="mt-6 space-y-2">
        {rules.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-sm font-semibold">{r.name}</div>
              <div className="mt-1 text-xs text-slate-400">
                severity: {r.severity}
              </div>
            </div>
            <div className="text-xs">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 ${
                  r.enabled
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-700 bg-transparent text-slate-300"
                }`}
              >
                {r.enabled ? "已启用" : "未启用"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-xs text-slate-400">
        TODO（后续）：
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>规则编辑页（pattern/threshold/action）</li>
          <li>在 WF‑04+/WF‑01/WF‑02 输出前做检测</li>
          <li>命中写入 auditLog.risky + 命中明细</li>
        </ul>
      </div>
    </div>
  );
}
