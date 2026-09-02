import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { AvailabilityBadge, CoverArtCard, type BookRow } from "@/components/rec-card";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { recommendBooks } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

const CHIPS = ["Mystery", "Thriller", "Sci-Fi", "Self Growth", "Programming"] as const;

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({
    meta: [
      { title: "AI Recommendations — ShelfAI" },
      { name: "description", content: "Tell ShelfAI what you feel like reading and Gemini recommends books that are actually on the shelves." },
      { property: "og:title", content: "AI Recommendations — ShelfAI" },
      { property: "og:description", content: "Gemini-powered book recommendations from the real library catalogue." },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { session } = useSession();
  const [query, setQuery] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const ask = useServerFn(recommendBooks);

  const mutation = useMutation({
    mutationFn: async () => {
      await supabase.from("search_history").insert({ user_id: session!.user.id, query });
      return ask({ data: { query, interests } });
    },
  });

  const result = mutation.data;

  return (
    <ReaderPage title="Find books you'll love.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length < 2) return;
          mutation.mutate();
        }}
        className="surface p-4 sm:p-5"
      >
        <label htmlFor="ai-query" className="sr-only">
          Describe the book you're looking for
        </label>
        <textarea
          id="ai-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="Tell me what kind of book you're looking for…"
          className="w-full resize-none rounded-xl border border-border bg-secondary/40 px-4 py-3 text-base focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {CHIPS.map((chip) => {
            const active = interests.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                aria-pressed={active}
                onClick={() => setInterests((prev) => (active ? prev.filter((c) => c !== chip) : [...prev, chip]))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground",
                )}
              >
                {chip}
              </button>
            );
          })}
          <button
            type="submit"
            disabled={mutation.isPending || query.trim().length < 2}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Sparkles className="size-4 text-accent" aria-hidden="true" /> Ask AI
          </button>
        </div>
      </form>

      <div className="mt-8">
        {mutation.isPending ? <LoadingState label="AI is thinking…" /> : null}

        {mutation.isError ? (
          <EmptyState
            title="AI is temporarily unavailable."
            description="You can still browse and locate books by category."
            action={
              <Link to="/library" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Browse books by category
              </Link>
            }
          />
        ) : null}

        {result && !result.success ? (
          <EmptyState
            title={result.reason === "ai_unavailable" ? "AI is temporarily unavailable." : "No recommendations yet"}
            description={result.message}
            action={
              <Link to="/library" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Browse books by category
              </Link>
            }
          />
        ) : null}

        {result && result.success ? (
          <>
            <h2 className="mb-4 text-lg font-bold text-primary">Recommended for You</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {result.recommendations.map((rec) => {
                const book = (result.books as unknown as BookRow[]).find((b) => b.id === rec.book_id);
                if (!book) return null;
                return (
                  <RecCard
                    key={rec.book_id}
                    book={book}
                    reason={rec.reason}
                    score={rec.match_score}
                    recommendationId={result.recommendation_id}
                  />
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </ReaderPage>
  );
}

function RecCard({
  book,
  reason,
  score,
  recommendationId,
}: {
  book: BookRow;
  reason: string;
  score: number;
  recommendationId: string | null;
}) {
  const { session } = useSession();
  const [given, setGiven] = useState<string | null>(null);

  const feedback = async (value: "helpful" | "not_useful") => {
    setGiven(value);
    const { error } = await supabase.from("ai_feedback").insert({
      user_id: session!.user.id,
      book_id: book.id,
      recommendation_id: recommendationId,
      feedback: value,
    });
    if (error) toast.error("Could not save your feedback.");
    else toast.success("Thanks — this improves your recommendations.");
  };

  return (
    <article className="surface surface-hover flex gap-4 p-4">
      <div className="h-36 w-24 shrink-0">
        <CoverArtCard book={book} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug text-primary">{book.title}</h3>
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
            {score}% Match
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {book.genre} • {book.publication_year ?? "—"}
        </p>
        <p className="line-clamp-2 text-sm italic text-foreground">“{reason}”</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <AvailabilityBadge book={book} />
          <span className="text-xs font-semibold text-accent-foreground">Shelf {book.shelf_label}</span>
          <Link
            to="/locate/$bookId"
            params={{ bookId: book.id }}
            className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            Find Book
          </Link>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            aria-label="Helpful recommendation"
            onClick={() => void feedback("helpful")}
            className={cn("rounded-lg border border-border p-1.5", given === "helpful" && "border-success text-success")}
          >
            <ThumbsUp className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Not a useful recommendation"
            onClick={() => void feedback("not_useful")}
            className={cn("rounded-lg border border-border p-1.5", given === "not_useful" && "border-destructive text-destructive")}
          >
            <ThumbsDown className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
