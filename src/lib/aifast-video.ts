type ChatCompletionReq = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  // optional extra fields for vendor-specific routers
  [k: string]: unknown;
};

type VideoOut =
  | { kind: "base64"; bytes: Buffer }
  | { kind: "url"; url: string };

function parseOut(raw: string): VideoOut {
  const mUrl0 = raw.trim().match(/https?:\/\/\S+\.mp4(\?\S+)?/i);
  if (mUrl0) return { kind: "url", url: mUrl0[0] };

  // JSON (openai-like)
  let j: unknown;
  try {
    j = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Video response is not JSON and no mp4 url found");
  }

  const jj = j as { choices?: Array<{ message?: { content?: unknown } }> };
  const content: string = String(jj?.choices?.[0]?.message?.content || "");

  const m64 = content.match(/data:video\/mp4;base64,([A-Za-z0-9+/=]+)/);
  if (m64) return { kind: "base64", bytes: Buffer.from(m64[1], "base64") };

  const mUrl = content.match(/https?:\/\/\S+\.mp4(\?\S+)?/i);
  if (mUrl) return { kind: "url", url: mUrl[0] };

  throw new Error("No mp4 base64 or url found in response");
}

async function postJson(baseUrl: string, apiKey: string, path: string, payload: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  return { res, raw };
}

/**
 * Video generation via aifast.
 * We try multiple OpenAI-compatible shapes because routers differ:
 * 1) /v1/chat/completions (some providers route video models here)
 * 2) /v1/videos/generations
 * 3) /v1/video/generations
 */
export async function aifastVideoFromPrompt(
  prompt: string,
  opts?: { model?: string; durationSeconds?: number; aspectRatio?: "16:9" | "9:16" }
) {
  const baseUrl = process.env.AIFAST_BASE_URL;
  const apiKey = process.env.AIFAST_VIDEO_API_KEY || process.env.AIFAST_API_KEY;
  const m = opts?.model || process.env.AIFAST_VIDEO_MODEL;

  if (!baseUrl) throw new Error("AIFAST_BASE_URL missing");
  if (!apiKey) throw new Error("AIFAST_VIDEO_API_KEY/AIFAST_API_KEY missing");
  if (!m) throw new Error("AIFAST_VIDEO_MODEL missing");

  const duration = Math.max(5, Math.min(60, Number(opts?.durationSeconds || 15)));
  const aspect = opts?.aspectRatio || "16:9";

  const attempts: Array<{ path: string; payload: unknown; name: string }> = [
    {
      name: "chat.completions",
      path: "/v1/chat/completions",
      payload: {
        model: m,
        messages: [{ role: "user", content: prompt }],
        // vendor hints (ignored if unsupported)
        duration_seconds: duration,
        aspect_ratio: aspect,
        stream: false,
      } satisfies ChatCompletionReq,
    },
    {
      name: "videos.generations",
      path: "/v1/videos/generations",
      payload: {
        model: m,
        prompt,
        duration_seconds: duration,
        aspect_ratio: aspect,
      },
    },
    {
      name: "video.generations",
      path: "/v1/video/generations",
      payload: {
        model: m,
        prompt,
        duration_seconds: duration,
        aspect_ratio: aspect,
      },
    },
  ];

  let lastErr: unknown = null;
  for (const a of attempts) {
    try {
      const { res, raw } = await postJson(baseUrl, apiKey, a.path, a.payload);
      if (!res.ok) {
        throw new Error(`aifast video error ${res.status} (${a.name}): ${raw.slice(0, 500)}`);
      }
      return parseOut(raw);
    } catch (e: unknown) {
      lastErr = e;
      // If socket closed, try next path.
      continue;
    }
  }

  throw (lastErr instanceof Error ? lastErr : new Error(String(lastErr || "video failed")));
}
