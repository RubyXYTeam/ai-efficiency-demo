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
