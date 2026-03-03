export type DlpRule = {
  id: string;
  name: string;
  severity: "low" | "med" | "high";
  enabled: boolean;
  // Simple demo patterns (case-insensitive substring)
  patterns: string[];
};

const rules: DlpRule[] = [
  {
    id: "r_price",
    name: "敏感：底价/返点/返利",
    severity: "high",
    enabled: true,
    patterns: ["底价", "返点", "返利"],
  },
  {
    id: "r_pii",
    name: "个人信息：手机号/身份证",
    severity: "high",
    enabled: true,
    patterns: ["手机号", "身份证", "138", "139"],
  },
  {
    id: "r_overpromise",
    name: "过度承诺：保证/一定增产",
    severity: "med",
    enabled: true,
    patterns: ["保证", "一定增产", "必然增产", "稳赚"],
  },
];

export function listDlpRules() {
  return rules;
}

export function setDlpRuleEnabled(id: string, enabled: boolean) {
  const r = rules.find((x) => x.id === id);
  if (!r) return null;
  r.enabled = enabled;
  return r;
}

export type DlpHit = {
  ruleId: string;
  ruleName: string;
  severity: DlpRule["severity"];
  pattern: string;
};

export function dlpScan(text: string): DlpHit[] {
  const t = (text || "").toLowerCase();
  const hits: DlpHit[] = [];

  for (const r of rules) {
    if (!r.enabled) continue;
    for (const p of r.patterns) {
      const q = p.toLowerCase();
      if (q && t.includes(q)) {
        hits.push({
          ruleId: r.id,
          ruleName: r.name,
          severity: r.severity,
          pattern: p,
        });
      }
    }
  }

  // de-dup by rule+pattern
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = `${h.ruleId}::${h.pattern}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
