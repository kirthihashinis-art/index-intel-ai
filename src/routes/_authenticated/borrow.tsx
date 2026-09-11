import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { BookCard, type BookRow } from "@/components/book-ui";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { borrowBook } from "@/lib/library.functions";
import { GENRES, fetchAvailableBooks, fetchMyBorrowings } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/borrow")({
  head: () => ({
    meta: [
      { title: "Borrow Books — ShelfAI" },
      {
        name: "description",
        content: "Browse every book currently on the shelf and borrow a copy in one click, with live availability counts.",
      },
      { property: "og:title", content: "Borrow Books — ShelfAI" },
      { property: "og:description", content: "Borrow an available copy instantly and see live availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BorrowPage,
});

function BorrowPage() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [genre, setGenre] = useState<string>("All");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const books = useQuery({
    queryKey: ["available-books", genre],
    queryFn: () => fetchAvailableBooks(genre),
  });

  const loans = useQuery({
    queryKey: ["my-borrowings", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyBorrowings(userId!),
  });

  const activeBookIds = new Set(
    (loans.data ?? []).filter((l) => l.status === "borrowed").map((l) => l.book_id),
  );

  const borrow = useServerFn(borrowBook);
  const borrowMutation = useMutation({
    mutationFn: (bookId: string) => borrow({ data: { bookId } }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(`Book borrowed successfully! Due ${new Date(res.due_date).toLocaleDateString()}.`);
      void queryClient.invalidateQueries({ queryKey: ["available-books"] });
      void queryClient.invalidateQueries({ queryKey: ["my-borrowings"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void queryClient.invalidateQueries({ queryKey: ["book"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: () => toast.error("Could not borrow this book. Please try again."),
    onSettled: () => setPendingId(null),
  });

  return (
    <ReaderPage title="Borrow Books" description="Every title with a copy on the shelf right now.">
      <div className="mb-5 flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGenre(g)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary",
              genre === g && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {books.isPending ? (
        <LoadingState label="Loading available books…" />
      ) : books.isError ? (
        <ErrorState description="We could not load available books." onRetry={() => void books.refetch()} />
      ) : books.data.length === 0 ? (
        <EmptyState title="No copies available" description="Every book in this category is on loan right now." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.data.map((book) => (
            <BorrowCard
              key={book.id}
              book={book}
              alreadyBorrowed={activeBookIds.has(book.id)}
              pending={pendingId === book.id}
              onBorrow={() => {
                setPendingId(book.id);
                borrowMutation.mutate(book.id);
              }}
            />
          ))}
        </div>
      )}
    </ReaderPage>
  );
}

function BorrowCard({
  book,
  alreadyBorrowed,
  pending,
  onBorrow,
}: {
  book: BookRow;
  alreadyBorrowed: boolean;
  pending: boolean;
  onBorrow: () => void;
}) {
  const available = book.available_copies > 0;
  const disabled = !available || alreadyBorrowed || pending;

  return (
    <BookCard
      book={book}
      footer={
        <div className="mt-2 space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">
            {book.available_copies} of {book.total_copies} copies available
          </p>
          <button
            type="button"
            onClick={onBorrow}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center rounded-lg bg-success px-3 py-2 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Borrowing…" : alreadyBorrowed ? "Already borrowed" : available ? "Borrow" : "Unavailable"}
          </button>
          {!available ? (
            <p className="text-[11px] font-semibold text-destructive">This book is currently unavailable.</p>
          ) : null}
        </div>
      }
    />
  );
}
