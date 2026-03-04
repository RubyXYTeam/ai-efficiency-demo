import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { renderBenefits, renderGrid4 } from "@/lib/render-wf01";

export const runtime = "nodejs";

function readPublic(rel: string) {
  const p = path.join(process.cwd(), "public", rel);
  return fs.readFileSync(p);
}

export async function POST() {
  // Demo: use pre-generated assets from public/demo/aifast
  const a = readPublic("demo/aifast/grid_crop_01.png");
  const b = readPublic("demo/aifast/grid_crop_02.png");
  const c = readPublic("demo/aifast/grid_crop_03.png");
  const d = readPublic("demo/aifast/grid_crop_04.png");
  const product = readPublic("demo/aifast/benefits_product.png");

  const text = {
    title: "液体肥 · 核心卖点",
    subtitle: "（Demo）一键生成多风格详情物料",
    bullets: [
      "促根壮苗，缓苗更快",
      "提升吸收效率，长势更稳",
      "适用多作物场景（按说明使用）",
      "标准/高质档位可切换",
    ],
    compliance: "提示：效果因地力与管理方式不同存在差异，使用请以产品说明为准。",
  };

  const gridText = {
    heading: "适用作物 / 场景",
    items: ["玉米", "小麦", "柑橘", "番茄大棚"] as [string, string, string, string],
    compliance: text.compliance,
  };

  const outDir = path.join(process.cwd(), "public", "artifacts", "wf01");
  fs.mkdirSync(outDir, { recursive: true });

  const outputs: Array<{ templateId: "T1" | "T2" | "T3"; grid4: string; benefits: string }> = [];

  for (const tid of ["T1", "T2", "T3"] as const) {
    const grid = await renderGrid4(tid, { a, b, c, d }, gridText);
    const benefits = await renderBenefits(tid, product, text);

    const gridName = `grid4_${tid}.png`;
    const benName = `benefits_${tid}.png`;

    fs.writeFileSync(path.join(outDir, gridName), grid);
    fs.writeFileSync(path.join(outDir, benName), benefits);

    outputs.push({ templateId: tid, grid4: `/artifacts/wf01/${gridName}`, benefits: `/artifacts/wf01/${benName}` });
  }

  return NextResponse.json({ ok: true, outputs });
}
