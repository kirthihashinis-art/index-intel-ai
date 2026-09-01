const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const AI_MODEL = "google/gemini-2.5-flash";

export type ChatContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export function aiConfigured(): boolean {
  return Boolean(process.env["LOVABLE_API_KEY"]);
}

/** Calls the Gemini model through the server-side AI gateway. Never exposes the key. */
export async function callGemini(
  messages: Array<{ role: "system" | "user"; content: ChatContent }>,
  opts: { json?: boolean; model?: string } = {},
): Promise<{ ok: true; text: string; ms: number } | { ok: false; error: string; ms: number }> {
  const key = process.env["LOVABLE_API_KEY"];
  const started = Date.now();
  if (!key) {
    return { ok: false, error: "AI provider is not configured on the server.", ms: 0 };
  }
  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model ?? AI_MODEL,
        messages,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const ms = Date.now() - started;
    if (res.status === 429) return { ok: false, error: "AI rate limit reached. Try again shortly.", ms };
    if (res.status === 402) return { ok: false, error: "AI credits exhausted for this workspace.", ms };
    if (!res.ok) {
      const detail = await res.text();
      console.error("[ai] gateway error", res.status, detail.slice(0, 500));
      return { ok: false, error: `AI provider returned ${res.status}.`, ms };
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text) return { ok: false, error: "Empty AI response.", ms };
    return { ok: true, text, ms };
  } catch (err) {
    console.error("[ai] request failed", err);
    return { ok: false, error: "Could not reach the AI provider.", ms: Date.now() - started };
  }
}

/** Extracts the first JSON object from a model reply. */
export function parseJsonObject<T>(text: string): T | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
