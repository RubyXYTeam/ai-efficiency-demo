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

    // V1 图文版：复用 public/demo/aifast 下的示例图片（稳定可交付）
    const demoDir = path.join(process.cwd(), "public", "demo", "aifast");
    const images = {
      hero: fs.readFileSync(path.join(demoDir, "hero.png")),
      product: fs.readFileSync(path.join(demoDir, "benefits_product.png")),
      crops4: [
        fs.readFileSync(path.join(demoDir, "grid_crop_01.png")),
        fs.readFileSync(path.join(demoDir, "grid_crop_02.png")),
        fs.readFileSync(path.join(demoDir, "grid_crop_03.png")),
        fs.readFileSync(path.join(demoDir, "grid_crop_04.png")),
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
