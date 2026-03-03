import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { aifastImageFromPrompt } from "@/lib/aifast";
import { renderBenefits, renderGrid4 } from "@/lib/render-wf01";

export const runtime = "nodejs";

type Req = {
  qualityPreset?: "standard" | "hq";
  templateIds?: Array<"T1" | "T2" | "T3">;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function nowId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Req;
  const quality = body.qualityPreset || "standard";
  const templateIds = body.templateIds?.length ? body.templateIds : (["T1", "T2", "T3"] as const);

  // Demo product text (from Console mock products)
  const { getProduct } = await import("@/lib/products");
  const p = getProduct("p_liquid_fert_20kg");
  const compliance =
    p?.compliance ||
    "提示：效果因地力与管理方式不同存在差异，使用请以产品说明为准。";

  // Prompts – HQ adds extra photographic details.
  const q = quality === "hq" ? "premium commercial photography, cinematic lighting, high detail, clean composition, 4k" : "realistic documentary photo, clean composition";

  const prompts = {
    hero: `A warm, documentary-style photo: a smiling agronomist holding a 20kg liquid fertilizer bucket in a greenhouse, healthy green crops in the background, shallow depth of field, ${q}, no text, no watermark.`,
    crop1: `A thriving corn field, deep green leaves, sunlight, shallow depth of field, ${q}, no text.`,
    crop2: `A healthy wheat field at early growth stage, uniform growth, warm sunlight, ${q}, no text.`,
    crop3: `A citrus orchard with healthy glossy leaves and fruits, warm tone, ${q}, no text.`,
    crop4: `Inside a greenhouse with tomato plants, lush growth, irrigation lines visible, ${q}, no text.`,
    product: `A clean product hero photo: a 20kg liquid fertilizer bucket standing on soil in a greenhouse, soft natural light, ${q}, no text, no watermark.`,
  };

  const outBase = path.join(process.cwd(), "public", "artifacts", "wf01", `${nowId()}_${quality}`);
  ensureDir(outBase);

  // 1) Generate images
  const [hero, a, b, c, d, product] = await Promise.all([
    aifastImageFromPrompt(prompts.hero),
    aifastImageFromPrompt(prompts.crop1),
    aifastImageFromPrompt(prompts.crop2),
    aifastImageFromPrompt(prompts.crop3),
    aifastImageFromPrompt(prompts.crop4),
    aifastImageFromPrompt(prompts.product),
  ]);

  fs.writeFileSync(path.join(outBase, "hero.png"), hero);
  fs.writeFileSync(path.join(outBase, "grid_crop_01.png"), a);
  fs.writeFileSync(path.join(outBase, "grid_crop_02.png"), b);
  fs.writeFileSync(path.join(outBase, "grid_crop_03.png"), c);
  fs.writeFileSync(path.join(outBase, "grid_crop_04.png"), d);
  fs.writeFileSync(path.join(outBase, "benefits_product.png"), product);

  // 2) Render templates
  const text = {
    title: p?.name || "液体肥 · 核心卖点",
    subtitle: p?.subtitle ? `${p.subtitle}（${quality}）` : `（${quality}）一键生成多风格详情物料`,
    bullets: p?.bullets?.length
      ? p.bullets
      : [
          "促根壮苗，缓苗更快",
          "提升吸收效率，长势更稳",
          "适用多作物场景（按说明使用）",
          "标准/高质档位可切换",
        ],
    compliance,
  };

  const gridText = {
    heading: "适用作物 / 场景",
    items: (p?.gridLabels || ["玉米", "小麦", "柑橘", "番茄大棚"]) as [
      string,
      string,
      string,
      string,
    ],
    compliance,
  };

  const outputs: any[] = [];
  for (const tid of templateIds) {
    const grid = await renderGrid4(tid, { a, b, c, d }, gridText);
    const benefits = await renderBenefits(tid, product, text);

    const gridName = `grid4_${tid}.png`;
    const benName = `benefits_${tid}.png`;
    fs.writeFileSync(path.join(outBase, gridName), grid);
    fs.writeFileSync(path.join(outBase, benName), benefits);

    outputs.push({
      templateId: tid,
      grid4: `/artifacts/wf01/${path.basename(outBase)}/${gridName}`,
      benefits: `/artifacts/wf01/${path.basename(outBase)}/${benName}`,
    });
  }

  return NextResponse.json({
    ok: true,
    quality,
    base: `/artifacts/wf01/${path.basename(outBase)}/`,
    outputs,
  });
}
