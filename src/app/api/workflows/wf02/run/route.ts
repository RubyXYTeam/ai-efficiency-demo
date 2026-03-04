import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildWf02Pdf } from "@/lib/pdf/wf02";
import { getProduct } from "@/lib/products";
import { addAudit } from "@/lib/store";
import { dlpScan } from "@/lib/dlp";

export const runtime = "nodejs";

type Req = {
  productId?: string;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function nowId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Req;
    const productId = body.productId || "p_liquid_fert_20kg";
    const p = getProduct(productId);
    if (!p) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    // V2 图文版：同一产品只生成一次配图，后续复用。
    // - cache: public/artifacts/wf02_cache/<productId>/
    // - output pdf: public/artifacts/wf02/<timestamp>/catalog.pdf
    const cacheDir = path.join(process.cwd(), "public", "artifacts", "wf02_cache", productId);
    ensureDir(cacheDir);

    const cacheFiles = {
      hero: path.join(cacheDir, "hero.png"),
      product: path.join(cacheDir, "product.png"),
      crop1: path.join(cacheDir, "crop1.png"),
      crop2: path.join(cacheDir, "crop2.png"),
      crop3: path.join(cacheDir, "crop3.png"),
      crop4: path.join(cacheDir, "crop4.png"),
    };

    const hasAll =
      fs.existsSync(cacheFiles.hero) &&
      fs.existsSync(cacheFiles.product) &&
      fs.existsSync(cacheFiles.crop1) &&
      fs.existsSync(cacheFiles.crop2) &&
      fs.existsSync(cacheFiles.crop3) &&
      fs.existsSync(cacheFiles.crop4);

    if (!hasAll) {
      const { aifastImageFromPrompt } = await import("@/lib/aifast");
      const style =
        "flat vector illustration, modern tech style, clean shapes, soft gradients, minimal, no text, no watermark, 4k";

      const labels = (p.gridLabels || ["场景1", "场景2", "场景3", "场景4"]) as [
        string,
        string,
        string,
        string,
      ];

      const prompts = {
        hero: `A cover illustration for ${p.name}: modern clean tech illustration, abstract background, product category vibe, ${style}.`,
        product: `A product illustration of ${p.name}: centered object, clean lighting, studio vector style, ${style}.`,
        crop1: `An application scenario illustration related to ${labels[0]} for ${p.name}, ${style}.`,
        crop2: `An application scenario illustration related to ${labels[1]} for ${p.name}, ${style}.`,
        crop3: `An application scenario illustration related to ${labels[2]} for ${p.name}, ${style}.`,
        crop4: `An application scenario illustration related to ${labels[3]} for ${p.name}, ${style}.`,
      };

      const [hero, productImg, c1, c2, c3, c4] = await Promise.all([
        aifastImageFromPrompt(prompts.hero),
        aifastImageFromPrompt(prompts.product),
        aifastImageFromPrompt(prompts.crop1),
        aifastImageFromPrompt(prompts.crop2),
        aifastImageFromPrompt(prompts.crop3),
        aifastImageFromPrompt(prompts.crop4),
      ]);

      fs.writeFileSync(cacheFiles.hero, hero);
      fs.writeFileSync(cacheFiles.product, productImg);
      fs.writeFileSync(cacheFiles.crop1, c1);
      fs.writeFileSync(cacheFiles.crop2, c2);
      fs.writeFileSync(cacheFiles.crop3, c3);
      fs.writeFileSync(cacheFiles.crop4, c4);
    }

    const images = {
      hero: fs.readFileSync(cacheFiles.hero),
      product: fs.readFileSync(cacheFiles.product),
      crops4: [
        fs.readFileSync(cacheFiles.crop1),
        fs.readFileSync(cacheFiles.crop2),
        fs.readFileSync(cacheFiles.crop3),
        fs.readFileSync(cacheFiles.crop4),
      ] as [Buffer, Buffer, Buffer, Buffer],
    };

    const pdfBuf = await buildWf02Pdf({
      title: p.name,
      subtitle: p.subtitle,
      bullets: p.bullets,
      compliance: p.compliance,
      sections: [{ heading: "场景", body: [...p.gridLabels] }],
      images,
    });

    const outBase = path.join(process.cwd(), "public", "artifacts", "wf02", nowId());
    ensureDir(outBase);

    const fileName = "catalog.pdf";
    fs.writeFileSync(path.join(outBase, fileName), pdfBuf);

    const hits = dlpScan(
      [p.name, p.subtitle, p.bullets.join("\n"), p.gridLabels.join("\n"), p.compliance]
        .filter(Boolean)
        .join("\n\n")
    );
    const risky = hits.some((h) => h.severity === "high") || hits.length >= 3;

    const url = `/artifacts/wf02/${path.basename(outBase)}/${fileName}`;

    addAudit({
      workflowId: "wf02_catalog_pdf",
      dept: "市场部",
      actor: "demo-user",
      qualityPreset: "standard",
      costCny: 1.2,
      inputSummary: `${p.name}｜画册PDF（6页）`,
      outputSummary: `产物：catalog.pdf`,
      customerAlias: "内部",
      risky,
      dlpHits: hits,
    });

    return NextResponse.json({ ok: true, url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
