import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Library } from "lucide-react";

import { BookCard } from "@/components/book-ui";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/states";
import { GENRES, PAGE_SIZE, fetchBooks } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Explore Our Library — ShelfAI" },
      { name: "description", content: "Browse every book on the ShelfAI shelves by category, with live availability and shelf numbers." },
      { property: "og:title", content: "Explore Our Library — ShelfAI" },
      { property: "og:description", content: "Browse the ShelfAI catalogue with live availability and exact shelf numbers." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [genre, setGenre] = useState<string>("All");
  const [page, setPage] = useState(0);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["books", genre, page],
    queryFn: () => fetchBooks({ genre, page }),
    placeholderData: keepPreviousData,
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <ReaderPage
      title="Explore Our Library"
      description="Every book currently on the ShelfAI shelves, with live availability and its exact shelf."
    >
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {GENRES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={genre === item}
            onClick={() => {
              setGenre(item);
              setPage(0);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              genre === item
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:border-accent/60",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {isPending ? (
        <SkeletonGrid />
      ) : isError ? (
        <ErrorState description="We couldn't load the catalogue." onRetry={() => void refetch()} />
      ) : !data.books.length ? (
        <EmptyState icon={Library} title="No books found" description={`Nothing on the shelves under ${genre} yet.`} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
              disabled={page + 1 >= totalPages}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </ReaderPage>
  );
}
