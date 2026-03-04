import { PDFDocument, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";

export type Wf02Input = {
  title: string;
  subtitle: string;
  bullets: string[];
  compliance: string;
  sections?: Array<{ heading: string; body: string[] }>;
  // Optional images (PNG/JPEG) to enrich the PDF.
  images?: {
    hero?: Uint8Array;
    product?: Uint8Array;
    crops4?: [Uint8Array, Uint8Array, Uint8Array, Uint8Array];
  };
};

function wrapText(text: string, maxLen = 26) {
  const out: string[] = [];
  let cur = "";
  for (const ch of text) {
    cur += ch;
    if (cur.length >= maxLen) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

export async function buildWf02Pdf(input: Wf02Input) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Use a CJK-capable font to avoid WinAnsi encoding errors for Chinese.
  // Prefer single-font TTF/OTF first (more reliable with pdf-lib+fontkit).
  // TTC collections (e.g., PingFang.ttc) may fail with `this.font.layout is not a function`.
  const candidates = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/NISC18030.ttf",
    // Fallback to TTC collections if nothing else exists.
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
  ];

  let fontBytes: Buffer | null = null;
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        fontBytes = fs.readFileSync(p);
        break;
      }
    } catch {
      // ignore
    }
  }
  if (!fontBytes) throw new Error("No CJK font file found on system");

  // Note: .ttc font collections are supported via fontkit integration.
  const font = await pdf.embedFont(fontBytes, { subset: false });
  const fontBold = font;

  const W = 595.28; // A4 width (pt)
  const H = 841.89; // A4 height

  const theme = {
    bg: rgb(0.03, 0.04, 0.06),
    card: rgb(0.07, 0.09, 0.12),
    text: rgb(0.95, 0.96, 0.98),
    sub: rgb(0.72, 0.74, 0.78),
    line: rgb(0.2, 0.22, 0.26),
  };

  function pageBase() {
    const page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: theme.bg });
    return page;
  }

  function header(page: PDFPage, title: string, subtitle?: string) {
    page.drawText(title, { x: 48, y: H - 88, size: 26, font: fontBold, color: theme.text });
    if (subtitle) {
      page.drawText(subtitle, { x: 48, y: H - 114, size: 12, font, color: theme.sub });
    }
    page.drawLine({ start: { x: 48, y: H - 132 }, end: { x: W - 48, y: H - 132 }, thickness: 1, color: theme.line });
  }

  function footer(page: PDFPage, compliance: string) {
    const lines = wrapText(compliance, 44).slice(0, 2);
    page.drawLine({ start: { x: 48, y: 72 }, end: { x: W - 48, y: 72 }, thickness: 1, color: theme.line });
    page.drawText(lines[0] || "", { x: 48, y: 52, size: 9, font, color: theme.sub });
    if (lines[1]) page.drawText(lines[1], { x: 48, y: 40, size: 9, font, color: theme.sub });
  }

  // Embed images (best-effort)
  const img = input.images || {};
  const heroImg = img.hero ? await pdf.embedPng(img.hero) : null;
  const productImg = img.product ? await pdf.embedPng(img.product) : null;
  const crops4Img = img.crops4
    ? await Promise.all(img.crops4.map((b) => pdf.embedPng(b)))
    : null;

  // Page 1: cover (hero)
  {
    const page = pageBase();

    // Hero background image (top)
    if (heroImg) {
      const w = W - 96;
      const h = 360;
      page.drawImage(heroImg, { x: 48, y: H - 48 - h, width: w, height: h, opacity: 0.95 });
      // overlay dark gradient-ish block
      page.drawRectangle({ x: 48, y: H - 48 - h, width: w, height: h, color: rgb(0, 0, 0), opacity: 0.25 });
    } else {
      page.drawRectangle({ x: 48, y: H - 420, width: W - 96, height: 360, color: theme.card, borderColor: theme.line, borderWidth: 1 });
    }

    page.drawText("产品画册（Demo）", { x: 72, y: H - 120, size: 14, font: fontBold, color: theme.sub });
    page.drawText(input.title, { x: 72, y: H - 170, size: 34, font: fontBold, color: theme.text });
    page.drawText(input.subtitle, { x: 72, y: H - 202, size: 14, font, color: theme.sub });

    page.drawRectangle({ x: 48, y: 160, width: W - 96, height: 120, color: theme.card, borderColor: theme.line, borderWidth: 1 });
    page.drawText("结构：封面/概览/卖点/场景/注意事项/话术页", { x: 72, y: 240, size: 11, font, color: theme.sub });
    page.drawText("（图文版：图片按内容自动匹配/复用）", { x: 72, y: 220, size: 11, font, color: theme.sub });

    footer(page, input.compliance);
  }

  // Page 2: overview (product image)
  {
    const page = pageBase();
    header(page, "概览", input.title);

    // left: product image
    if (productImg) {
      const boxW = 220;
      const boxH = 220;
      page.drawRectangle({ x: 48, y: H - 410, width: boxW, height: boxH, color: theme.card, borderColor: theme.line, borderWidth: 1 });
      page.drawImage(productImg, { x: 58, y: H - 400, width: boxW - 20, height: boxH - 20 });
    }

    page.drawText("一句话价值：", { x: 290, y: H - 180, size: 13, font: fontBold, color: theme.text });
    page.drawText("提升销售沟通效率，保证合规表述可追溯。", { x: 290, y: H - 205, size: 12, font, color: theme.sub });

    page.drawRectangle({ x: 290, y: H - 410, width: W - 338, height: 180, color: theme.card, borderColor: theme.line, borderWidth: 1 });
    page.drawText("适用人群", { x: 310, y: H - 250, size: 12, font: fontBold, color: theme.text });
    page.drawText("销售 / 渠道 / 农技 / 运营（Demo）", { x: 310, y: H - 272, size: 11, font, color: theme.sub });

    page.drawText("交付物", { x: 310, y: H - 312, size: 12, font: fontBold, color: theme.text });
    page.drawText("1) 详情图（T1/T2/T3）  2) 画册PDF  3) 拜访清单Markdown", { x: 310, y: H - 334, size: 11, font, color: theme.sub });

    footer(page, input.compliance);
  }

  // Page 3: selling points
  {
    const page = pageBase();
    header(page, "核心卖点", input.title);

    if (productImg) {
      const w = W - 96;
      const h = 140;
      page.drawRectangle({ x: 48, y: H - 220, width: w, height: h, color: theme.card, borderColor: theme.line, borderWidth: 1 });
      page.drawImage(productImg, { x: 48 + 10, y: H - 220 + 10, width: w - 20, height: h - 20 });
    }

    const bullets = (input.bullets || []).slice(0, 6);
    let y = H - 260;
    for (const b of bullets) {
      page.drawRectangle({ x: 48, y: y - 26, width: W - 96, height: 36, color: theme.card, borderColor: theme.line, borderWidth: 1 });
      page.drawText("• " + b, { x: 64, y: y - 12, size: 12, font: fontBold, color: theme.text });
      y -= 54;
    }

    footer(page, input.compliance);
  }

  // Page 4: scenarios
  {
    const page = pageBase();
    header(page, "场景与适用", input.title);

    const items = (input.sections?.[0]?.body || ["玉米", "小麦", "柑橘", "番茄大棚"]).slice(0, 4);
    const boxW = (W - 96 - 18) / 2;
    const boxH = 160;
    const startY = H - 220;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 48 + col * (boxW + 18);
      const y = startY - row * (boxH + 18);
      page.drawRectangle({ x, y: y - boxH, width: boxW, height: boxH, color: theme.card, borderColor: theme.line, borderWidth: 1 });

      // image area
      if (crops4Img?.[i]) {
        page.drawImage(crops4Img[i], { x: x + 10, y: y - 10 - 96, width: boxW - 20, height: 96 });
        page.drawRectangle({ x: x + 10, y: y - 10 - 96, width: boxW - 20, height: 96, borderColor: theme.line, borderWidth: 1, opacity: 0 });
      }

      page.drawText(items[i] ? `场景 ${i + 1}` : "-", { x: x + 18, y: y - 122, size: 11, font: fontBold, color: theme.sub });
      page.drawText(items[i] || "-", { x: x + 18, y: y - 148, size: 16, font: fontBold, color: theme.text });
      page.drawText("建议话术：按说明使用，因地制宜。", { x: x + 18, y: y - 168, size: 10, font, color: theme.sub });
    }

    footer(page, input.compliance);
  }

  // Page 5: cautions
  {
    const page = pageBase();
    header(page, "注意事项", input.title);

    const cautions = [
      "不承诺具体增产/增收数值（需试验数据）",
      "避免涉及客户敏感信息与底价",
      "对外口径保持一致：以说明书/标签为准",
      "如需对比竞品，使用可验证公开证据",
      "特殊作物/土壤/气候需先小范围验证",
    ];

    let y = H - 190;
    for (const c of cautions) {
      page.drawText("• " + c, { x: 56, y, size: 12, font: fontBold, color: theme.text });
      y -= 24;
    }

    footer(page, input.compliance);
  }

  // Page 6: scripts
  {
    const page = pageBase();
    header(page, "拜访话术页（Demo）", input.title);

    const blocks = [
      {
        h: "开场",
        b: "我们先确认贵司当前的目标和约束，再给出一页清单（可复用）。",
      },
      {
        h: "三问",
        b: "1) 今年主目标是什么？ 2) 决策链路谁拍板？ 3) 现有方案的最大痛点？",
      },
      {
        h: "收口",
        b: "我们会把'需验证项'列出来，下次带着数据再对齐，不做口头承诺。",
      },
    ];

    let y = H - 200;
    for (const bl of blocks) {
      page.drawRectangle({ x: 48, y: y - 120, width: W - 96, height: 110, color: theme.card, borderColor: theme.line, borderWidth: 1 });
      page.drawText(bl.h, { x: 72, y: y - 34, size: 13, font: fontBold, color: theme.text });
      const lines = wrapText(bl.b, 44).slice(0, 3);
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], { x: 72, y: y - 60 - i * 18, size: 11, font, color: theme.sub });
      }
      y -= 138;
    }

    footer(page, input.compliance);
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
