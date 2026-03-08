"use client";

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
  tags?: string[];
  inputs: Field[];
  templateMarkdown: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function PublishPage() {
  const [list, setList] = useState<Workflow[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const active = useMemo(() => list.find((w) => w.id === activeId) || null, [list, activeId]);

  const [draft, setDraft] = useState<Workflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    const res = await fetch("/api/console/workflows");
    const j = await res.json();
    const ws = (j.workflows || []) as Workflow[];
    setList(ws);
    if (!activeId && ws[0]?.id) setActiveId(ws[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active) setDraft(active);
  }, [activeId, active]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/console/workflows/${encodeURIComponent(draft.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(String(j?.error || `HTTP ${res.status}`));
      setMsg("已保存");
      await refresh();
    } catch (e: unknown) {
      setMsg(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(next: boolean) {
    if (!draft) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/console/workflows/${encodeURIComponent(draft.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(String(j?.error || `HTTP ${res.status}`));
      setMsg(next ? "已发布到员工端" : "已下线（员工端不可见）");
      await refresh();
    } catch (e: unknown) {
      setMsg(`发布失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function addField() {
    if (!draft) return;
    const next: Field = { key: `field_${draft.inputs.length + 1}`, label: "新字段", type: "text" };
    setDraft({ ...draft, inputs: [...draft.inputs, next] });
  }

  function updateField(idx: number, patch: Partial<Field>) {
    if (!draft) return;
    const next = draft.inputs.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setDraft({ ...draft, inputs: next });
  }

  function removeField(idx: number) {
    if (!draft) return;
    const next = draft.inputs.filter((_, i) => i !== idx);
    setDraft({ ...draft, inputs: next });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">工作流发布台（纯模板版）</div>
          <div className="mt-1 text-xs text-slate-400">
            在这里配置输入表单 + Markdown 输出模板，并一键发布到员工端工作台。
          </div>
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={save}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition disabled:opacity-60"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      {msg ? <div className="mt-3 text-xs text-slate-200">{msg}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-xs font-semibold text-slate-300">工作流列表</div>
          <div className="mt-3 space-y-2">
            {list.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveId(w.id)}
                className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition ${
                  activeId === w.id
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-400"
                }`}
              >
                <div className="font-semibold">{w.name}</div>
                <div className="mt-1 text-xs opacity-80">{w.published ? "已发布" : "未发布"}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
          {!draft ? (
            <div className="text-xs text-slate-400">请选择左侧工作流。</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-xs font-semibold text-slate-300">名称</div>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-slate-300">标签（逗号分隔）</div>
                  <input
                    value={(draft.tags || []).join(",")}
                    onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(/,\s*/).filter(Boolean) })}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block md:col-span-2">
                  <div className="text-xs font-semibold text-slate-300">简介</div>
                  <textarea
                    value={draft.desc}
                    onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                    className="mt-2 w-full min-h-16 rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-300">输入字段（表单）</div>
                  <button
                    onClick={addField}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-slate-400 transition"
                  >
                    + 新增字段
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {draft.inputs.map((f, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <label className="block">
                          <div className="text-[11px] text-slate-400">key（用于 {"{{key}}"}）</div>
                          <input
                            value={f.key}
                            onChange={(e) => updateField(idx, { key: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-2.5 py-2 text-xs"
                          />
                        </label>
                        <label className="block">
                          <div className="text-[11px] text-slate-400">label</div>
                          <input
                            value={f.label}
                            onChange={(e) => updateField(idx, { label: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-2.5 py-2 text-xs"
                          />
                        </label>
                        <label className="block">
                          <div className="text-[11px] text-slate-400">type</div>
                          <select
                            value={f.type}
                            onChange={(e) => updateField(idx, { type: e.target.value as Field["type"] })}
                            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-2.5 py-2 text-xs"
                          >
                            <option value="text">text</option>
                            <option value="textarea">textarea</option>
                            <option value="select">select</option>
                          </select>
                        </label>
                        <div className="flex items-end">
                          <button
                            onClick={() => removeField(idx)}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-red-400 transition"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <label className="mt-3 block">
                        <div className="text-[11px] text-slate-400">placeholder</div>
                        <input
                          value={f.placeholder || ""}
                          onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/20 px-2.5 py-2 text-xs"
                        />
                      </label>
                    </div>
                  ))}
                  {!draft.inputs.length ? <div className="text-xs text-slate-400">（暂无字段）</div> : null}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-300">输出模板（Markdown）</div>
                <div className="mt-1 text-xs text-slate-400">用 {"{{key}}"} 引用输入字段</div>
                <textarea
                  value={draft.templateMarkdown}
                  onChange={(e) => setDraft({ ...draft, templateMarkdown: e.target.value })}
                  className="mt-2 w-full min-h-[240px] rounded-lg border border-slate-700 bg-slate-950/20 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={saving}
                  onClick={() => togglePublish(!draft.published)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                    draft.published
                      ? "border border-slate-600 text-slate-200 hover:border-slate-400"
                      : "bg-slate-100 text-slate-900 hover:bg-white"
                  }`}
                >
                  {draft.published ? "下线（员工端不可见）" : "发布到员工端"}
                </button>
                <div className="text-xs text-slate-400">状态：{draft.published ? "已发布" : "未发布"}</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
