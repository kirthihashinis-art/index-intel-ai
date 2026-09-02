import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, X } from "lucide-react";

import { AvailabilityBadge, Rating, type BookRow } from "@/components/book-ui";
import { CoverArt } from "@/components/brand";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { searchBooks } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search Books — ShelfAI" },
      { name: "description", content: "Search the ShelfAI catalogue by title, author, ISBN or genre and locate the exact shelf." },
      { property: "og:title", content: "Search Books — ShelfAI" },
      { property: "og:description", content: "Find a specific book or author and locate it on the shelves." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: history } = useQuery({
    queryKey: ["search-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_history")
        .select("id, query")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const results = useQuery({
    queryKey: ["search", submitted],
    enabled: submitted.length > 0,
    queryFn: () => searchBooks(submitted),
  });

  const run = async (value: string) => {
    const q = value.trim();
    if (!q) return;
    setTerm(q);
    setSubmitted(q);
    await supabase.from("search_history").insert({ user_id: session!.user.id, query: q });
    void queryClient.invalidateQueries({ queryKey: ["search-history"] });
  };

  return (
    <ReaderPage title="Search Books" description="Find a specific book or author, then locate it on the shelves.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(term);
        }}
        className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
      >
        <label htmlFor="search-input" className="sr-only">
          Search by book name or author
        </label>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="search-input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by book name or author…"
            className="w-full rounded-xl border border-border bg-secondary/40 py-3 pl-9 pr-3 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
          Search
        </button>
      </form>

      {history?.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</span>
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void run(item.query)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-accent/60"
            >
              {item.query}
            </button>
          ))}
          <button
            type="button"
            onClick={async () => {
              await supabase.from("search_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              void queryClient.invalidateQueries({ queryKey: ["search-history"] });
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"
          >
            <X className="size-3" aria-hidden="true" /> Clear Search History
          </button>
        </div>
      ) : null}

      <div className="mt-7">
        {!submitted ? (
          <EmptyState
            icon={Search}
            title="Search the library"
            description="Try “Harry Potter”, “J.K. Rowling”, “Paulo Coelho” or an ISBN."
          />
        ) : results.isPending ? (
          <LoadingState label="Searching the library…" />
        ) : results.isError ? (
          <ErrorState onRetry={() => void results.refetch()} />
        ) : !results.data.length ? (
          <EmptyState title="No books found" description={`Nothing in the catalogue matches “${submitted}”.`} />
        ) : (
          <ul className="space-y-3">
            {results.data.map((book) => (
              <li key={book.id}>
                <ResultRow book={book} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ReaderPage>
  );
}

function ResultRow({ book }: { book: BookRow }) {
  return (
    <article className="surface surface-hover flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="h-28 w-20 shrink-0">
        <CoverArt title={book.title} author={book.author} coverUrl={book.cover_url} />
      </div>
      <div className="min-w-0 flex-1">
        <Link to="/books/$bookId" params={{ bookId: book.id }} className="text-base font-bold text-primary hover:underline">
          {book.title}
        </Link>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{book.genre}</span>
          <Rating value={book.rating} />
          <AvailabilityBadge book={book} />
          <span className="text-xs text-muted-foreground">
            {book.available_copies} of {book.total_copies} copies free
          </span>
        </div>
        <p className="mt-1.5 text-xs font-semibold text-accent-foreground">
          Section {book.section} • Shelf {book.shelf_label} • Row {book.row_no} • Position {book.position_no}
        </p>
      </div>
      <Link
        to="/locate/$bookId"
        params={{ bookId: book.id }}
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        Locate Book
      </Link>
    </article>
  );
}
