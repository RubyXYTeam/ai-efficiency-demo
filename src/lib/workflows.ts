import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type WorkflowInputField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[]; // for select
};

export type PublishedWorkflow = {
  id: string;
  name: string;
  desc: string;
  tags?: string[];
  inputs: WorkflowInputField[];
  templateMarkdown: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

const dataDir = path.join(process.cwd(), ".data");
const filePath = path.join(dataDir, "workflows.json");

type Persisted = { workflows: PublishedWorkflow[] };

function safeMkdirp(p: string) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    // ignore
  }
}

function load(): Persisted {
  try {
    if (!fs.existsSync(filePath)) return { workflows: [] };
    const raw = fs.readFileSync(filePath, "utf-8");
    const j = JSON.parse(raw) as Persisted;
    if (!j?.workflows) return { workflows: [] };
    return j;
  } catch {
    return { workflows: [] };
  }
}

function atomicWrite(obj: Persisted) {
  safeMkdirp(dataDir);
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

function nowIso() {
  return new Date().toISOString();
}

export function listWorkflows(opts?: { publishedOnly?: boolean }) {
  const p = load();
  const ws = Array.isArray(p.workflows) ? p.workflows : [];
  const filtered = opts?.publishedOnly ? ws.filter((w) => w.published) : ws;
  return filtered.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getWorkflow(id: string) {
  return listWorkflows().find((w) => w.id === id) || null;
}

export function upsertWorkflow(
  patch: Partial<PublishedWorkflow> & { id?: string }
) {
  const p = load();
  const ws = Array.isArray(p.workflows) ? p.workflows : [];

  const id = (patch.id && String(patch.id)) || `wf_${randomUUID()}`;
  const exist = ws.find((w) => w.id === id);
  const base: PublishedWorkflow = exist || {
    id,
    name: "未命名工作流",
    desc: "",
    tags: [],
    inputs: [],
    templateMarkdown: "# 输出\n\n（请配置模板）\n",
    published: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const next: PublishedWorkflow = {
    ...base,
    ...patch,
    id,
    updatedAt: nowIso(),
  };

  const idx = ws.findIndex((w) => w.id === id);
  if (idx >= 0) ws[idx] = next;
  else ws.unshift(next);

  atomicWrite({ workflows: ws });
  return next;
}

export function setPublished(id: string, published: boolean) {
  const wf = getWorkflow(id);
  if (!wf) throw new Error("workflow not found");
  return upsertWorkflow({ ...wf, published });
}

export function renderTemplate(md: string, vars: Record<string, string>) {
  // simple {{key}} replacement
  return md.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, (_m, k) => {
    const v = vars[String(k)] ?? "";
    return v;
  });
}

export function ensureSeedDeirWorkflow() {
  const existing = listWorkflows();
  if (existing.length) return;

  const seedPath = path.join(
    process.cwd(),
    "docs",
    "sales-workflows",
    "迪尔集团-售前工作流-基础框架.md"
  );

  let template = "";
  try {
    template = fs.readFileSync(seedPath, "utf-8");
  } catch {
    template = "# 迪尔集团｜售前工作流（基础框架）\n\n（未找到种子文件）\n";
  }

  upsertWorkflow({
    id: "deir_presales_v1",
    name: "迪尔集团｜售前工作流（电力公开招标｜竞品压价）",
    desc: "把电力公开招标大单售前动作标准化：作战包/必问清单/对比表/纪要/反压价话术。",
    tags: ["电力", "公开招标", "售前", "竞品压价"],
    inputs: [
      { key: "customer", label: "客户/业主", type: "text", required: true, placeholder: "例如：某电厂/某园区能源公司" },
      { key: "project", label: "项目名称/范围", type: "textarea", placeholder: "例如：2x350MW热电联产安装…" },
      { key: "goal", label: "本次目标", type: "text", placeholder: "进入短名单/拿需求/锁参数/锁招采" },
      { key: "constraints", label: "约束/红线", type: "textarea", placeholder: "不出底价/不编造/合规…" },
      { key: "competitor", label: "主要竞品/压价情况", type: "textarea", placeholder: "竞品是谁？压价点在哪？" },
    ],
    templateMarkdown:
      "# 迪尔集团｜售前工作流（基础框架）\n\n> 客户：{{customer}}\n> 项目：{{project}}\n> 目标：{{goal}}\n> 约束：{{constraints}}\n> 竞品：{{competitor}}\n\n---\n\n" + template,
    published: true,
  });
}
