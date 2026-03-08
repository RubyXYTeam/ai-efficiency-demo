import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const base = path.join(process.cwd(), "docs", "sales-workflows");
  const filePath = path.join(base, id);

  // basic path traversal guard
  if (!filePath.startsWith(base)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!id.toLowerCase().endsWith(".md")) {
    return NextResponse.json({ error: "not a markdown file" }, { status: 400 });
  }

  try {
    const md = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ id, md });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
