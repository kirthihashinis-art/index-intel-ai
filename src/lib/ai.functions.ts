import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGemini, parseJsonObject, aiConfigured, AI_MODEL } from "./ai.server";

const CANDIDATE_FIELDS =
  "id, book_code, title, author, genre, description, rating, publication_year, available_copies, total_copies, section, shelf_label, row_no, position_no";

export type Recommendation = {
  book_id: string;
  reason: string;
  match_score: number;
};

/** Public-safe AI health probe (never returns the key). */
export const aiHealth = createServerFn({ method: "GET" }).handler(async () => {
  if (!aiConfigured()) {
    return { status: "unconfigured" as const, provider: "gemini", model: AI_MODEL, checked_at: new Date().toISOString() };
  }
  const res = await callGemini([{ role: "user", content: "Reply with the single word: ok" }]);
  return {
    status: res.ok ? ("ok" as const) : ("error" as const),
    provider: "gemini",
    model: AI_MODEL,
    latency_ms: res.ms,
    message: res.ok ? "Gemini API connected" : res.error,
    checked_at: new Date().toISOString(),
  };
});

export const testAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ prompt: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const res = await callGemini([
      { role: "system", content: "You are ShelfAI's diagnostics assistant. Answer in at most 2 short sentences." },
      { role: "user", content: data.prompt },
    ]);
    return res.ok
      ? { success: true as const, response: res.text, latency_ms: res.ms }
      : { success: false as const, message: res.error, latency_ms: res.ms };
  });

export const recommendBooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        query: z.string().min(2).max(500),
        interests: z.array(z.string().max(40)).max(8).default([]),
        excludeBookId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Private personalization signals — scoped to the authenticated user only.
    const [favRes, historyRes, profileRes] = await Promise.all([
      supabase.from("favorites").select("books(title, genre, author)").limit(10),
      supabase.from("search_history").select("query").order("created_at", { ascending: false }).limit(8),
      supabase.from("profiles").select("interests, favorite_genres, reading_preferences").eq("id", userId).maybeSingle(),
    ]);

    // Candidate retrieval: never send the whole library to the model.
    const words = data.query
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((w) => w.length > 3)
      .slice(0, 6);
    const terms = [...new Set([...words, ...data.interests.map((i) => i.toLowerCase())])];

    const candidates = new Map<string, Record<string, unknown>>();
    if (terms.length) {
      const or = terms
        .flatMap((t) => [`title.ilike.%${t}%`, `author.ilike.%${t}%`, `genre.ilike.%${t}%`, `description.ilike.%${t}%`])
        .join(",");
      const { data: matched } = await supabase.from("books").select(CANDIDATE_FIELDS).or(or).limit(28);
      matched?.forEach((b) => candidates.set(b.id, b));
    }
    const { data: topRated } = await supabase
      .from("books")
      .select(CANDIDATE_FIELDS)
      .order("rating", { ascending: false })
      .limit(22);
    topRated?.forEach((b) => {
      if (candidates.size < 40) candidates.set(b.id, b);
    });
    if (data.excludeBookId) candidates.delete(data.excludeBookId);

    const list = [...candidates.values()];
    if (!list.length) {
      return { success: false as const, reason: "no_books" as const, message: "The library has no books to recommend yet." };
    }

    const payload = list.map((b) => ({
      book_id: b["id"],
      title: b["title"],
      author: b["author"],
      genre: b["genre"],
      year: b["publication_year"],
      rating: b["rating"],
      summary: String(b["description"] ?? "").slice(0, 220),
      available: Number(b["available_copies"] ?? 0) > 0,
    }));

    const favourites = (favRes.data ?? [])
      .map((f) => (f as { books?: { title?: string } }).books?.title)
      .filter(Boolean);
    const profile = profileRes.data;

    const res = await callGemini(
      [
        {
          role: "system",
          content:
            "You are ShelfAI, a librarian recommending books. You MUST only recommend books from the provided LIBRARY list, " +
            "using their exact book_id values. Never invent books. Prefer available copies. Return JSON only, shaped as " +
            '{"recommendations":[{"book_id":"...","reason":"one short sentence, max 18 words","match_score":0-100}]} with 3 to 6 items, best first.',
        },
        {
          role: "user",
          content: JSON.stringify({
            request: data.query,
            selected_interests: data.interests,
            reader_profile: {
              interests: profile?.interests ?? [],
              favorite_genres: profile?.favorite_genres ?? [],
              preferences: profile?.reading_preferences ?? "",
              favourite_titles: favourites,
              recent_searches: (historyRes.data ?? []).map((h) => h.query),
            },
            LIBRARY: payload,
          }),
        },
      ],
      { json: true },
    );

    if (!res.ok) {
      return { success: false as const, reason: "ai_unavailable" as const, message: res.error };
    }

    const parsed = parseJsonObject<{ recommendations?: Recommendation[] }>(res.text);
    const valid = (parsed?.recommendations ?? [])
      .filter((r) => r && typeof r.book_id === "string" && candidates.has(r.book_id))
      .slice(0, 6)
      .map((r) => ({
        book_id: r.book_id,
        reason: String(r.reason ?? "").slice(0, 160),
        match_score: Math.max(0, Math.min(100, Math.round(Number(r.match_score) || 0))),
      }));

    if (!valid.length) {
      return { success: false as const, reason: "invalid_ai_response" as const, message: "AI did not return valid library books." };
    }

    const { data: saved } = await supabase
      .from("ai_recommendations")
      .insert({ user_id: userId, query: data.query, recommendations: valid })
      .select("id")
      .maybeSingle();

    const books = list.filter((b) => valid.some((v) => v.book_id === b["id"]));
    return {
      success: true as const,
      recommendation_id: saved?.id ?? null,
      latency_ms: res.ms,
      recommendations: valid,
      books,
    };
  });

type Detected = { title: string; shelf_label: string; row_no?: number; position_no?: number; confidence: number };

export const scanShelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        shelfLabel: z.string().min(1).max(20),
        image: z.string().max(8_000_000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: shelfBooks } = await supabase
      .from("books")
      .select("id, title, author, section, shelf_label, row_no, position_no")
      .limit(200);
    const catalogue = shelfBooks ?? [];

    // Demo mode: no image supplied, or AI not configured. Clearly labelled to the user.
    if (!data.image || !aiConfigured()) {
      const onShelf = catalogue.filter((b) => b.shelf_label === data.shelfLabel);
      const strays = catalogue.filter((b) => b.shelf_label !== data.shelfLabel).slice(0, 3);
      const detected: Detected[] = [
        ...onShelf.map((b) => ({ title: b.title, shelf_label: data.shelfLabel, row_no: b.row_no, position_no: b.position_no, confidence: 90 })),
        ...strays.map((b) => ({ title: b.title, shelf_label: data.shelfLabel, confidence: 80 })),
      ];
      const misplaced = strays.map((b) => ({
        title: b.title,
        detected_shelf: data.shelfLabel,
        expected_shelf: b.shelf_label,
        confidence: 80,
      }));
      const { data: scan } = await supabase
        .from("shelf_scans")
        .insert({
          librarian_id: userId,
          shelf_label: data.shelfLabel,
          mode: "demo",
          detected_books: detected,
          misplaced_books: misplaced,
        })
        .select("id")
        .maybeSingle();
      return {
        success: true as const,
        mode: "demo" as const,
        scan_id: scan?.id ?? null,
        detected,
        misplaced,
        message: !data.image ? "Demo mode — no shelf image supplied, results generated from catalogue data." : "Demo mode — AI vision is not configured.",
      };
    }

    const res = await callGemini(
      [
        {
          role: "system",
          content:
            "You are ShelfAI's shelf vision service. Read visible book spines/covers in the photo of library shelf " +
            `${data.shelfLabel}. Match them against the CATALOGUE titles only. Return JSON only: ` +
            '{"detected":[{"title":"exact catalogue title","confidence":0-100}]}. Omit anything you cannot read.',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Shelf: ${data.shelfLabel}. CATALOGUE: ${JSON.stringify(catalogue.map((b) => b.title))}`,
            },
            { type: "image_url", image_url: { url: data.image } },
          ],
        },
      ],
      { json: true },
    );

    if (!res.ok) return { success: false as const, mode: "ai" as const, message: res.error };

    const parsed = parseJsonObject<{ detected?: Array<{ title: string; confidence: number }> }>(res.text);
    const byTitle = new Map(catalogue.map((b) => [b.title.toLowerCase(), b]));
    const detected: Detected[] = [];
    const misplaced: Array<{ title: string; detected_shelf: string; expected_shelf: string; confidence: number }> = [];

    for (const item of parsed?.detected ?? []) {
      const book = byTitle.get(String(item?.title ?? "").toLowerCase().trim());
      if (!book) continue;
      const confidence = Math.max(0, Math.min(100, Math.round(Number(item.confidence) || 0)));
      detected.push({
        title: book.title,
        shelf_label: data.shelfLabel,
        row_no: book.row_no,
        position_no: book.position_no,
        confidence,
      });
      if (book.shelf_label !== data.shelfLabel) {
        misplaced.push({
          title: book.title,
          detected_shelf: data.shelfLabel,
          expected_shelf: book.shelf_label,
          confidence,
        });
      }
    }

    const { data: scan } = await supabase
      .from("shelf_scans")
      .insert({
        librarian_id: userId,
        shelf_label: data.shelfLabel,
        mode: "ai",
        detected_books: detected,
        misplaced_books: misplaced,
      })
      .select("id")
      .maybeSingle();

    return {
      success: true as const,
      mode: "ai" as const,
      scan_id: scan?.id ?? null,
      detected,
      misplaced,
      message: detected.length ? "Shelf analysed with Gemini vision." : "No catalogue titles could be read from this image.",
    };
  });

export const verifyReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        bookId: z.string().uuid(),
        image: z.string().max(8_000_000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: book } = await supabase
      .from("books")
      .select("id, title, author, section, shelf_label, row_no, position_no")
      .eq("id", data.bookId)
      .maybeSingle();
    if (!book) return { success: false as const, message: "Book not found." };

    const expected = {
      section: book.section,
      shelf_label: book.shelf_label,
      row_no: book.row_no,
      position_no: book.position_no,
    };

    if (!data.image) {
      return {
        success: true as const,
        mode: "manual" as const,
        result: "uncertain" as const,
        confidence: 0,
        expected,
        message: "No shelf image provided — placement could not be verified automatically.",
      };
    }
    if (!aiConfigured()) {
      return {
        success: true as const,
        mode: "demo" as const,
        result: "uncertain" as const,
        confidence: 0,
        expected,
        message: "Demo mode — AI vision is not configured, so shelf placement was not verified.",
      };
    }

    const res = await callGemini(
      [
        {
          role: "system",
          content:
            "You are ShelfAI's return verification service. Given a photo of a library shelf and an expected placement, " +
            'decide whether the book appears to be shelved there. Return JSON only: {"result":"correct|wrong|uncertain","confidence":0-100,"observation":"one short sentence"}. ' +
            "Use 'uncertain' whenever the image is unclear, unreadable, or does not show a shelf.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Book: "${book.title}" by ${book.author}. Expected placement: Section ${book.section}, Shelf ${book.shelf_label}, Row ${book.row_no}, Position ${book.position_no}. Shelf labels are usually printed on the shelf edge.`,
            },
            { type: "image_url", image_url: { url: data.image } },
          ],
        },
      ],
      { json: true },
    );

    if (!res.ok) return { success: false as const, message: res.error, expected };

    const parsed = parseJsonObject<{ result?: string; confidence?: number; observation?: string }>(res.text);
    const raw = String(parsed?.result ?? "uncertain").toLowerCase();
    const result = raw === "correct" || raw === "wrong" ? (raw as "correct" | "wrong") : ("uncertain" as const);
    const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed?.confidence) || 0)));
    return {
      success: true as const,
      mode: "ai" as const,
      result: confidence < 55 && result !== "uncertain" ? ("uncertain" as const) : result,
      confidence,
      expected,
      message: String(parsed?.observation ?? "").slice(0, 200),
      latency_ms: res.ms,
    };
  });
