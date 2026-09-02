import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MapPin } from "lucide-react";
import { toast } from "sonner";

import { AvailabilityBadge, BookCard, LocationPath, Rating, type BookRow } from "@/components/book-ui";
import { CoverArt } from "@/components/brand";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { recommendBooks } from "@/lib/ai.functions";
import { borrowBook, reserveBook } from "@/lib/library.functions";
import { fetchBook, fetchFavoriteIds, toggleFavorite } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/books/$bookId")({
  head: () => ({
    meta: [
      { title: "Book details — ShelfAI" },
      { name: "description", content: "Full book details: description, availability, copies and the exact shelf position in the library." },
      { property: "og:title", content: "Book details — ShelfAI" },
      { property: "og:description", content: "Availability, copies and exact shelf position for this book." },
    ],
  }),
  component: BookDetails,
});

function BookDetails() {
  const { bookId } = Route.useParams();
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const book = useQuery({ queryKey: ["book", bookId], queryFn: () => fetchBook(bookId) });
  const favorites = useQuery({ queryKey: ["favorite-ids"], queryFn: fetchFavoriteIds });
  const similar = useQuery({
    queryKey: ["similar", bookId],
    enabled: Boolean(book.data),
    queryFn: () =>
      recommendBooks({
        data: {
          query: `Books similar to "${book.data!.title}" by ${book.data!.author} in the ${book.data!.genre} genre.`,
          interests: [book.data!.genre],
          excludeBookId: bookId,
        },
      }),
    retry: false,
  });

  const borrow = useServerFn(borrowBook);
  const reserve = useServerFn(reserveBook);

  const borrowMutation = useMutation({
    mutationFn: () => borrow({ data: { bookId } }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(`Borrowed — due ${new Date(res.due_date).toLocaleDateString()}`);
      void queryClient.invalidateQueries();
      navigate({ to: "/locate/$bookId", params: { bookId } });
    },
    onError: () => toast.error("Could not borrow this book."),
  });

  const reserveMutation = useMutation({
    mutationFn: () => reserve({ data: { bookId } }),
    onSuccess: (res) => {
      if (!res.success) toast.error(res.message);
      else toast.success(`Reserved — you are number ${res.queue_position} in the queue.`);
      void queryClient.invalidateQueries();
    },
  });

  if (book.isPending) {
    return (
      <ReaderPage title="Book details">
        <LoadingState label="Loading book…" />
      </ReaderPage>
    );
  }
  if (book.isError) {
    return (
      <ReaderPage title="Book details">
        <ErrorState onRetry={() => void book.refetch()} />
      </ReaderPage>
    );
  }
  if (!book.data) {
    return (
      <ReaderPage title="Book details">
        <EmptyState title="Book not found" description="This title is no longer in the catalogue." />
      </ReaderPage>
    );
  }

  const data = book.data;
  const isFavorite = favorites.data?.has(data.id) ?? false;
  const available = data.available_copies > 0;

  return (
    <ReaderPage title={data.title} description={`${data.author} • ${data.genre}`}>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="mx-auto w-full max-w-[260px]">
          <div className="aspect-[3/4] w-full">
            <CoverArt title={data.title} author={data.author} coverUrl={data.cover_url} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <AvailabilityBadge book={data} />
              <Rating value={data.rating} />
              <span className="text-sm text-muted-foreground">
                {data.available_copies} of {data.total_copies} copies available
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{data.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta label="Genre" value={data.genre} />
              <Meta label="ISBN" value={data.isbn || "—"} />
              <Meta label="Published" value={String(data.publication_year ?? "—")} />
              <Meta label="Book ID" value={data.book_code} />
            </dl>
          </div>

          <div className="surface border-accent/40 p-5">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent-foreground">
              <MapPin className="size-4 text-accent" aria-hidden="true" /> Location
            </h2>
            <LocationPath book={data} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/locate/$bookId"
              params={{ bookId: data.id }}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Locate Book
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  const next = await toggleFavorite(data.id, session!.user.id, isFavorite);
                  toast.success(next ? "Added to favorites" : "Removed from favorites");
                  void queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
                  void queryClient.invalidateQueries({ queryKey: ["favorites"] });
                } catch {
                  toast.error("Could not update favorites.");
                }
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-primary",
                isFavorite && "border-destructive/40 text-destructive",
              )}
            >
              <Heart className={cn("size-4", isFavorite && "fill-destructive")} aria-hidden="true" />
              {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            </button>
            {available ? (
              <button
                type="button"
                onClick={() => borrowMutation.mutate()}
                disabled={borrowMutation.isPending}
                className="rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-success-foreground disabled:opacity-60"
              >
                {borrowMutation.isPending ? "Borrowing…" : "Borrow Book"}
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-destructive">Currently unavailable</span>
                <button
                  type="button"
                  onClick={() => reserveMutation.mutate()}
                  disabled={reserveMutation.isPending}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground disabled:opacity-60"
                >
                  {reserveMutation.isPending ? "Reserving…" : "Reserve Book"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-primary">You May Also Like</h2>
        {similar.isPending ? (
          <LoadingState label="AI is thinking…" />
        ) : similar.data && similar.data.success ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(similar.data.books as unknown as BookRow[]).map((item) => (
              <BookCard key={item.id} book={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="AI is temporarily unavailable."
            description="Browse the same category instead — search and locating still work."
            action={
              <Link to="/library" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Browse books by category
              </Link>
            }
          />
        )}
      </section>
    </ReaderPage>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-primary">{value}</dd>
    </div>
  );
}
