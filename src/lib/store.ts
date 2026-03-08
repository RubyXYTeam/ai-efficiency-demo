import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export type WorkflowId =
  | "wf01_product_images"
  | "wf02_catalog_pdf"
  | "wf04_customer_brief"
  | "wf05_previsit"
  | "wf06_promo_video";

export type RunStatus = "queued" | "running" | "succeeded" | "failed";

export type AuditLog = {
  id: string;
  createdAt: string;
  workflowId: WorkflowId;
  dept: string;
  actor: string;
  qualityPreset: "standard" | "hq";
  costCny: number;
  inputSummary: string;
  outputSummary: string;
  customerAlias: string;
  risky: boolean;
  dlpHits?: Array<{ ruleId: string; ruleName: string; severity: string; pattern: string }>;
};

export type RunRecord = {
  id: string;
  createdAt: string;
  workflowId: WorkflowId;
  status: RunStatus;
  markdown?: string;
  artifactUrl?: string;
  artifactType?: "pdf" | "video" | "images" | "text";
  auditLogId?: string;
  error?: string;
};

/**
 * Demo store: in-memory + JSON persistence.
 * - Default path: <project>/.data/store.json (gitignored)
 * - Goal: dev server restart doesn't wipe audit/run history.
 */

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "store.json");

type Persisted = {
  runs: RunRecord[];
  audits: AuditLog[];
  customerCounter: number;
  customerAliasMap: Array<[string, string]>;
};

function safeMkdirp(p: string) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    // ignore
  }
}

function loadPersisted(): Persisted | null {
  try {
    if (!fs.existsSync(dataFile)) return null;
    const raw = fs.readFileSync(dataFile, "utf-8");
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object") return null;
    return j as Persisted;
  } catch {
    return null;
  }
}

function atomicWriteJson(filePath: string, obj: unknown) {
  safeMkdirp(path.dirname(filePath));
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

// In-memory state
const runs = new Map<string, RunRecord>();
let audits: AuditLog[] = [];

let customerCounter = 0;
const customerAliasMap = new Map<string, string>();

function persistNow() {
  const payload: Persisted = {
    runs: Array.from(runs.values()),
    audits,
    customerCounter,
    customerAliasMap: Array.from(customerAliasMap.entries()),
  };
  try {
    atomicWriteJson(dataFile, payload);
  } catch {
    // best-effort
  }
}

// Load persisted state on module init
(() => {
  const p = loadPersisted();
  if (!p) return;

  try {
    for (const r of p.runs || []) runs.set(r.id, r);
    audits = Array.isArray(p.audits) ? p.audits : [];
    customerCounter = Number(p.customerCounter || 0);
    for (const [k, v] of p.customerAliasMap || []) {
      if (typeof k === "string" && typeof v === "string") customerAliasMap.set(k, v);
    }
  } catch {
    // ignore load errors
  }
})();

export function getCustomerAlias(realCustomerName: string) {
  const key = (realCustomerName || "").trim();
  if (!key) return "客户?";
  const exist = customerAliasMap.get(key);
  if (exist) return exist;
  customerCounter += 1;
  const alias = `客户${String.fromCharCode(64 + Math.min(customerCounter, 26))}`; // A-Z
  customerAliasMap.set(key, alias);
  persistNow();
  return alias;
}

export function createRun(workflowId: WorkflowId): RunRecord {
  const id = `run_${randomUUID()}`;
  const rec: RunRecord = {
    id,
    createdAt: new Date().toISOString(),
    workflowId,
    status: "queued",
  };
  runs.set(id, rec);
  persistNow();
  return rec;
}

export function updateRun(id: string, patch: Partial<RunRecord>) {
  const rec = runs.get(id);
  if (!rec) throw new Error("run not found");
  const next = { ...rec, ...patch };
  runs.set(id, next);
  persistNow();
  return next;
}

export function getRun(id: string) {
  return runs.get(id) || null;
}

export function listRuns(opts?: { workflowId?: WorkflowId; limit?: number }) {
  const limit = Math.max(1, Math.min(200, opts?.limit ?? 50));
  const all = Array.from(runs.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  const filtered = opts?.workflowId
    ? all.filter((r) => r.workflowId === opts.workflowId)
    : all;
  return filtered.slice(0, limit);
}

export function addAudit(log: Omit<AuditLog, "id" | "createdAt">) {
  const entry: AuditLog = {
    id: `log_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...log,
  };
  audits = [entry, ...audits];
  persistNow();
  return entry;
}

export function listAudits() {
  return audits;
}

export function getAudit(id: string) {
  return audits.find((a) => a.id === id) || null;
}

export function resetStoreForDemo() {
  runs.clear();
  audits = [];
  customerCounter = 0;
  customerAliasMap.clear();
  persistNow();
}
