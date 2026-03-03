import { NextResponse } from "next/server";
import { listProducts, upsertProduct, type Product } from "@/lib/products";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ products: listProducts() });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Product;
  if (!body?.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (!body?.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const saved = upsertProduct(body);
  return NextResponse.json({ ok: true, product: saved });
}
