type ChatCompletionReq = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

/**
 * Video generation via aifast OpenAI-compatible endpoint.
 * Expects model to return either:
 * - data:video/mp4;base64,<...>
 * - or a URL to an mp4 in plain text.
 */
export async function aifastVideoFromPrompt(prompt: string, model?: string) {
  const baseUrl = process.env.AIFAST_BASE_URL;
  const apiKey = process.env.AIFAST_VIDEO_API_KEY || process.env.AIFAST_API_KEY;
  const m = model || process.env.AIFAST_VIDEO_MODEL;

  if (!baseUrl) throw new Error("AIFAST_BASE_URL missing");
  if (!apiKey) throw new Error("AIFAST_VIDEO_API_KEY/AIFAST_API_KEY missing");
  if (!m) throw new Error("AIFAST_VIDEO_MODEL missing");

  const body: ChatCompletionReq = {
    model: m,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`aifast video error ${res.status}: ${raw.slice(0, 500)}`);
  }

  let j: unknown;
  try {
    j = JSON.parse(raw) as unknown;
  } catch {
    // Some providers return plain text URL
    const mUrl = raw.trim().match(/https?:\/\/\S+\.mp4(\?\S+)?/i);
    if (mUrl) return { kind: "url" as const, url: mUrl[0] };
    throw new Error("Video response is not JSON and no mp4 url found");
  }

  const jj = j as { choices?: Array<{ message?: { content?: unknown } }> };
  const content: string = String(jj?.choices?.[0]?.message?.content || "");

  const m64 = content.match(/data:video\/mp4;base64,([A-Za-z0-9+/=]+)/);
  if (m64) {
    return { kind: "base64" as const, bytes: Buffer.from(m64[1], "base64") };
  }

  const mUrl = content.match(/https?:\/\/\S+\.mp4(\?\S+)?/i);
  if (mUrl) return { kind: "url" as const, url: mUrl[0] };

  throw new Error("No mp4 base64 or url found in response");
}
