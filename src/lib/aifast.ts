type ChatCompletionReq = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

export async function aifastChatCompletion(
  messages: ChatCompletionReq["messages"],
  model?: string
) {
  const baseUrl = process.env.AIFAST_BASE_URL;
  const apiKey = process.env.AIFAST_TEXT_API_KEY || process.env.AIFAST_API_KEY;
  const primary = model || process.env.AIFAST_TEXT_MODEL;
  const fallback = process.env.AIFAST_TEXT_MODEL_FALLBACK;

  if (!baseUrl) throw new Error("AIFAST_BASE_URL missing");
  if (!apiKey) throw new Error("AIFAST_TEXT_API_KEY/AIFAST_API_KEY missing");
  if (!primary) throw new Error("AIFAST_TEXT_MODEL missing");

  async function call(m: string) {
    const body: ChatCompletionReq = { model: m, messages };

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`aifast chat error ${res.status}: ${text.slice(0, 500)}`);
    }

    return JSON.parse(text);
  }

  try {
    return await call(primary);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const shouldFallback =
      !!fallback &&
      fallback !== primary &&
      (msg.includes("model_not_found") || msg.includes("No available channel"));

    if (!shouldFallback) throw e;
    return await call(fallback);
  }
}

export async function aifastImageFromPrompt(prompt: string, model?: string) {
  const baseUrl = process.env.AIFAST_BASE_URL;
  const apiKey = process.env.AIFAST_IMAGE_API_KEY || process.env.AIFAST_API_KEY;
  const m = model || process.env.AIFAST_IMAGE_MODEL;

  if (!baseUrl) throw new Error("AIFAST_BASE_URL missing");
  if (!apiKey) throw new Error("AIFAST_IMAGE_API_KEY/AIFAST_API_KEY missing");
  if (!m) throw new Error("AIFAST_IMAGE_MODEL missing");

  const body = {
    model: m,
    messages: [
      {
        role: "user",
        content: `Create an image: ${prompt}`,
      },
    ],
  };

  const maxAttempts = 3;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 120000); // 120s timeout

    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`aifast image error ${res.status}: ${raw.slice(0, 500)}`);
      }

      const j = JSON.parse(raw);
      const content: string = j?.choices?.[0]?.message?.content || "";
      const m0 = content.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
      if (!m0) throw new Error("No base64 png found in response");
      return Buffer.from(m0[1], "base64");
    } catch (e: unknown) {
      lastErr = e;
      // small backoff
      await new Promise((r) => setTimeout(r, 600 * attempt));
    } finally {
      clearTimeout(t);
    }
  }

  throw (lastErr instanceof Error ? lastErr : new Error(String(lastErr || "aifast image failed")));
}
