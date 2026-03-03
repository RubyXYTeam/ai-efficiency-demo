import { randomUUID } from "crypto";

export type WorkflowId = "wf04_customer_brief";

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
  auditLogId?: string;
  error?: string;
};

// Demo-only in-memory store (no persistence). Replace with DB later.
const runs = new Map<string, RunRecord>();
const audits: AuditLog[] = [];

let customerCounter = 0;
const customerAliasMap = new Map<string, string>();

export function getCustomerAlias(realCustomerName: string) {
  const key = realCustomerName.trim();
  if (!key) return "客户?";
  const exist = customerAliasMap.get(key);
  if (exist) return exist;
  customerCounter += 1;
  const alias = `客户${String.fromCharCode(64 + Math.min(customerCounter, 26))}`; // A-Z
  customerAliasMap.set(key, alias);
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
  return rec;
}

export function updateRun(id: string, patch: Partial<RunRecord>) {
  const rec = runs.get(id);
  if (!rec) throw new Error("run not found");
  const next = { ...rec, ...patch };
  runs.set(id, next);
  return next;
}

export function getRun(id: string) {
  return runs.get(id) || null;
}

export function addAudit(log: Omit<AuditLog, "id" | "createdAt">) {
  const entry: AuditLog = {
    id: `log_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...log,
  };
  audits.unshift(entry);
  return entry;
}

export function listAudits() {
  return audits;
}

export function getAudit(id: string) {
  return audits.find((a) => a.id === id) || null;
}
