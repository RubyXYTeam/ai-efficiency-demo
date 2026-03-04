# AI Efficiency Demo (AI‑CoE)

一个可演示的「企业 AI 效能中枢」Demo：员工端工作流一键产出交付物 → 全程审计 → 老板端驾驶舱聚合（近 7 天：成本 / 产量 / 风险）。

Repo: https://github.com/RubyXYTeam/ai-efficiency-demo

---

## 1) Quick Start

### Requirements
- Node.js 20+（本项目当前在本机 Node 22 通过）

### Install
```bash
npm i
```

### Run (dev)
> 默认端口 3010（避免占用 3000/3001）。

```bash
npm run dev:3010
```

如果提示 `EADDRINUSE`（端口被占用）：
- 换端口：`npm run dev -- --port 3011`
- 或关闭占用 3010 的进程后再启动

Open:
- Login： http://localhost:3010/login

---

## 2) Demo Routes

### 员工端（WorkBench）
- 工作台：`/employee/workbench`
- WF‑01 一键出商品详情图：`/employee/workbench/wf01`
- WF‑02 产品画册（PDF）：`/employee/workbench/wf02`
- WF‑04+ 客户业务理解（1分钟清单）：`/employee/workbench/wf04`
- WF‑05 售前拜访助手（更全版）：`/employee/workbench/wf05`

### 老板端（Boss）
- 驾驶舱 / 效能座舱（近 7 天聚合）：`/boss/dashboard`
- 审计列表（强脱敏摘要）：`/boss/audit`

### 顾问端（Console）
- Console 首页：`/console`
- 产品库（Demo）：`/console/products`
- DLP（Demo）：`/console/dlp`
- 模板下发中心（Demo）：`/console/templates`

---

## 3) Data & Persistence (Demo)

为便于演示，审计日志 / runs / 客户别名默认会落盘到：
- `./.data/store.json`

该目录已加入 `.gitignore`，不会提交到仓库。

---

## 4) What’s Next (Roadmap)

- 老板看板“一页式可复制摘要”（周会/晨会一键复制）
- 自动检索（优先 grok/gork）与引用标注
- DLP 命中统计接入座舱（按天/按规则/按工作流）
- 权限壳（角色/导航控制/假登录）
- WF‑01 稳定性（队列/重试/并发限制）

---

## Notes

- 这是演示工程：默认不做真实鉴权；老板端仅展示强脱敏摘要。
- 若出现端口占用：请换端口启动，或关闭已占用端口的进程。
