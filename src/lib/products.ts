export type Product = {
  id: string;
  name: string;
  subtitle: string;
  bullets: string[];
  gridLabels: [string, string, string, string];
  compliance: string;
};

const products: Product[] = [
  {
    id: "p_ai_efficiency_workflows",
    name: "AI落地提效工作流（销售/项目/安质通用）",
    subtitle: "一键产出交付物 + 全程审计（成本/风险/产量）",
    bullets: [
      "把高频动作做成工作流：清单/纪要/材料/PDF一键出",
      "合规可控：禁区提示 + DLP 命中 + 审计留痕",
      "交付稳定：模板固定，零基础也能用",
      "可量化：老板驾驶舱看产量/成本/风险",
    ],
    gridLabels: ["客户拜访作战包", "投标/澄清材料", "项目周报/月报", "安质检查清单"],
    compliance:
      "提示：AI 输出仅作草稿与结构化建议，涉及合同/报价/承诺/安全质量等内容需人工复核；不得泄露客户敏感信息。",
  },
  {
    id: "p_liquid_fert_20kg",
    name: "液体肥 · 核心卖点",
    subtitle: "（Demo）一键生成多风格详情物料",
    bullets: [
      "促根壮苗，缓苗更快",
      "提升吸收效率，长势更稳",
      "适用多作物场景（按说明使用）",
      "标准/高质档位可切换",
    ],
    gridLabels: ["玉米", "小麦", "柑橘", "番茄大棚"],
    compliance: "提示：效果因地力与管理方式不同存在差异，使用请以产品说明为准。",
  },
];

export function listProducts() {
  return products;
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id) || null;
}

export function upsertProduct(next: Product) {
  const idx = products.findIndex((p) => p.id === next.id);
  if (idx >= 0) products[idx] = next;
  else products.unshift(next);
  return next;
}
