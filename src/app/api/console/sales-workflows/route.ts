import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const dir = path.join(process.cwd(), "docs", "sales-workflows");
  try {
    if (!fs.existsSync(dir)) return NextResponse.json({ workflows: [] });
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".md"))
      .map((f) => ({
        id: f,
        title: f.replace(/\.md$/i, ""),
      }));
    return NextResponse.json({ workflows: files });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
