import sharp from "sharp";

export type Wf01Text = {
  title: string;
  subtitle: string;
  bullets: string[];
  compliance: string;
};

const WIDTH = 1080;
const HEIGHT = 1440;

function svgText(
  lines: Array<{ text: string; size: number; weight?: number; color?: string }>,
  x: number,
  y: number,
  align: "start" | "middle" | "end" = "start"
) {
  const parts = lines
    .map((l, i) => {
      const dy = i === 0 ? 0 : Math.round(l.size * 1.25);
      const fill = l.color || "#ffffff";
      const fw = l.weight || 700;
      return `<tspan x="${x}" dy="${dy}" fill="${fill}" font-size="${l.size}" font-weight="${fw}">${escapeXml(
        l.text
      )}</tspan>`;
    })
    .join("");

  return `<text x="${x}" y="${y}" text-anchor="${align}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial" >${parts}</text>`;
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function renderGrid4(
  templateId: "T1" | "T2" | "T3",
  images: {
    a: Buffer;
    b: Buffer;
    c: Buffer;
    d: Buffer;
  },
  text: { heading: string; items: [string, string, string, string]; compliance: string }
) {
  const bg = templateId === "T2" ? "#0b0b0c" : templateId === "T3" ? "#0a0a0a" : "#f5f0e8";
  const cardBg = templateId === "T2" ? "#141416" : templateId === "T3" ? "#111112" : "#ffffff";
  const titleColor = templateId === "T1" ? "#2b1e14" : "#f4f4f5";
  const subColor = templateId === "T1" ? "#6b5a4b" : "#bdbdbf";

  const padding = 56;
  const gap = 24;
  const topH = 210;
  const gridW = WIDTH - padding * 2;
  const cellW = Math.floor((gridW - gap) / 2);
  const cellH = 420;

  async function cell(img: Buffer, label: string) {
    const pic = await sharp(img)
      .resize(cellW, cellH, { fit: "cover" })
      .toBuffer();

    const labelSvg = `
      <svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${cellW}" height="${cellH}" fill="rgba(0,0,0,0)"/>
        <rect x="24" y="${cellH - 86}" width="${Math.min(
      520,
      24 + label.length * 24
    )}" height="52" rx="18" fill="rgba(0,0,0,0.45)"/>
        <text x="44" y="${cellH - 50}" font-size="26" font-weight="700" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial">${escapeXml(
          label
        )}</text>
      </svg>`;

    return sharp(pic).composite([{ input: Buffer.from(labelSvg) }]).toBuffer();
  }

  const A = await cell(images.a, text.items[0]);
  const B = await cell(images.b, text.items[1]);
  const C = await cell(images.c, text.items[2]);
  const D = await cell(images.d, text.items[3]);

  const canvas = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bg },
  });

  const headingSvg = `
  <svg width="${WIDTH}" height="${topH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="rgba(0,0,0,0)"/>
    ${svgText(
      [
        { text: text.heading, size: 44, weight: 800, color: titleColor },
        { text: "（Demo版式）", size: 18, weight: 600, color: subColor },
      ],
      padding,
      78,
      "start"
    )}
  </svg>`;

  const complianceSvg = `
  <svg width="${WIDTH}" height="120" xmlns="http://www.w3.org/2000/svg">
    ${svgText(
      [{ text: text.compliance, size: 18, weight: 600, color: subColor }],
      padding,
      56,
      "start"
    )}
  </svg>`;

  const y0 = padding + topH;
  const x0 = padding;

  const comps = [
    { input: Buffer.from(headingSvg), left: 0, top: padding - 10 },
    { input: await sharp({
      create: { width: WIDTH - padding * 2, height: 1, channels: 4, background: templateId === "T1" ? "#e5d8c8" : "#2a2a2a" },
    }).png().toBuffer(), left: padding, top: padding + 120 },

    // grid background card
    {
      input: await sharp({
        create: { width: WIDTH - padding * 2, height: cellH * 2 + gap + 40, channels: 4, background: cardBg },
      })
        .png()
        .toBuffer(),
      left: padding,
      top: y0 - 20,
    },

    { input: A, left: x0 + 20, top: y0 },
    { input: B, left: x0 + 20 + cellW + gap, top: y0 },
    { input: C, left: x0 + 20, top: y0 + cellH + gap },
    { input: D, left: x0 + 20 + cellW + gap, top: y0 + cellH + gap },

    { input: Buffer.from(complianceSvg), left: 0, top: HEIGHT - 120 },
  ];

  return canvas.composite(comps).png().toBuffer();
}

export async function renderBenefits(
  templateId: "T1" | "T2" | "T3",
  productImg: Buffer,
  text: Wf01Text
) {
  const bg = templateId === "T2" ? "#0b0b0c" : templateId === "T3" ? "#0a0a0a" : "#f5f0e8";
  const titleColor = templateId === "T1" ? "#2b1e14" : "#f4f4f5";
  const subColor = templateId === "T1" ? "#6b5a4b" : "#bdbdbf";
  const cardBg = templateId === "T2" ? "#141416" : templateId === "T3" ? "#111112" : "#ffffff";

  const padding = 56;

  const img = await sharp(productImg)
    .resize(520, 520, { fit: "cover" })
    .png()
    .toBuffer();

  const canvas = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: bg },
  });

  const headerSvg = `
  <svg width="${WIDTH}" height="240" xmlns="http://www.w3.org/2000/svg">
    ${svgText(
      [
        { text: text.title, size: 52, weight: 900, color: titleColor },
        { text: text.subtitle, size: 22, weight: 700, color: subColor },
      ],
      padding,
      88,
      "start"
    )}
  </svg>`;

  const bullets = text.bullets.slice(0, 6);
  const bulletLines = bullets.map((b) => `• ${b}`);

  const bulletsSvg = `
  <svg width="${WIDTH}" height="520" xmlns="http://www.w3.org/2000/svg">
    ${svgText(
      bulletLines.map((t) => ({ text: t, size: 24, weight: 700, color: titleColor })),
      padding,
      80,
      "start"
    )}
  </svg>`;

  const complianceSvg = `
  <svg width="${WIDTH}" height="120" xmlns="http://www.w3.org/2000/svg">
    ${svgText(
      [{ text: text.compliance, size: 18, weight: 600, color: subColor }],
      padding,
      56,
      "start"
    )}
  </svg>`;

  const comps = [
    { input: Buffer.from(headerSvg), left: 0, top: padding - 10 },
    {
      input: await sharp({
        create: { width: WIDTH - padding * 2, height: 660, channels: 4, background: cardBg },
      })
        .png()
        .toBuffer(),
      left: padding,
      top: 280,
    },
    { input: img, left: padding + 40, top: 320 },
    { input: Buffer.from(bulletsSvg), left: 0, top: 340 },
    { input: Buffer.from(complianceSvg), left: 0, top: HEIGHT - 120 },
  ];

  return canvas.composite(comps).png().toBuffer();
}
