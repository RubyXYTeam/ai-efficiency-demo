import { listAudits, type AuditLog } from "@/lib/store";

export type BossMetrics = {
  windowDays: number;
  from: string;
  to: string;
  costTotalCny: number;
  costByPreset: { standard: number; hq: number };
  volumeTotal: number;
  volumeByWorkflow: Record<string, number>;
  riskTotal: number;
  riskBreakdown: {
    riskyFlag: number;
    failedRuns: number;
    highCostRuns: number;
  };
  byDay: Array<{ day: string; cost: number; volume: number; risk: number }>;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function inWindow(a: AuditLog, fromMs: number, toMs: number) {
  const t = Date.parse(a.createdAt);
  return Number.isFinite(t) && t >= fromMs && t <= toMs;
}

export function computeBossMetrics(windowDays = 7): BossMetrics {
  const audits = listAudits();
  const to = new Date();
  const toMs = to.getTime();
  const from = new Date(to);
  from.setDate(from.getDate() - (windowDays - 1));
  const from0 = startOfDay(from);
  const fromMs = from0.getTime();

  const dayBuckets = new Map<string, { cost: number; volume: number; risk: number }>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(from0);
    d.setDate(d.getDate() + i);
    dayBuckets.set(isoDay(d), { cost: 0, volume: 0, risk: 0 });
  }

  let costTotalCny = 0;
  const costByPreset = { standard: 0, hq: 0 };
  let volumeTotal = 0;
  const volumeByWorkflow: Record<string, number> = {};

  const riskBreakdown = {
    riskyFlag: 0,
    failedRuns: 0,
    highCostRuns: 0,
  };

  for (const a of audits) {
    if (!inWindow(a, fromMs, toMs)) continue;

    const day = a.createdAt.slice(0, 10);
    const bucket = dayBuckets.get(day);

    const cost = Number(a.costCny || 0);
    costTotalCny += cost;
    if (a.qualityPreset === "hq") costByPreset.hq += cost;
    else costByPreset.standard += cost;

    volumeTotal += 1;
    volumeByWorkflow[a.workflowId] = (volumeByWorkflow[a.workflowId] || 0) + 1;

    // Risk heuristics for demo:
    const failed = (a.outputSummary || "").includes("失败");
    const highCost = cost >= 2.5;
    const risk = (a.risky ? 1 : 0) + (failed ? 1 : 0) + (highCost ? 1 : 0);

    if (a.risky) riskBreakdown.riskyFlag += 1;
    if (failed) riskBreakdown.failedRuns += 1;
    if (highCost) riskBreakdown.highCostRuns += 1;

    if (bucket) {
      bucket.cost += cost;
      bucket.volume += 1;
      bucket.risk += risk;
    }
  }

  const byDay = Array.from(dayBuckets.entries()).map(([day, v]) => ({
    day,
    cost: Number(v.cost.toFixed(2)),
    volume: v.volume,
    risk: v.risk,
  }));

  const riskTotal = riskBreakdown.riskyFlag + riskBreakdown.failedRuns + riskBreakdown.highCostRuns;

  return {
    windowDays,
    from: from0.toISOString(),
    to: to.toISOString(),
    costTotalCny: Number(costTotalCny.toFixed(2)),
    costByPreset: {
      standard: Number(costByPreset.standard.toFixed(2)),
      hq: Number(costByPreset.hq.toFixed(2)),
    },
    volumeTotal,
    volumeByWorkflow,
    riskTotal,
    riskBreakdown,
    byDay,
  };
}
