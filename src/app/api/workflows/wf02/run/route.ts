import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildWf02Pdf } from "@/lib/pdf/wf02";
import { getProduct } from "@/lib/products";

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
  const body = (await req.json().catch(() => ({}))) as Req;
  const productId = body.productId || "p_liquid_fert_20kg";
  const p = getProduct(productId);
  if (!p) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  const pdfBuf = await buildWf02Pdf({
    title: p.name,
    subtitle: p.subtitle,
    bullets: p.bullets,
    compliance: p.compliance,
    sections: [
      { heading: "场景", body: [...p.gridLabels] },
    ],
  });

  const outBase = path.join(process.cwd(), "public", "artifacts", "wf02", nowId());
  ensureDir(outBase);

  const fileName = "catalog.pdf";
  fs.writeFileSync(path.join(outBase, fileName), pdfBuf);

  return NextResponse.json({
    ok: true,
    url: `/artifacts/wf02/${path.basename(outBase)}/${fileName}`,
  });
}
