import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, History } from "lucide-react";
import { toast } from "sonner";

import { CoverArt } from "@/components/brand";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { returnBook } from "@/lib/library.functions";
import { fetchMyBorrowings, type BorrowingRow } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/my-books")({
  head: () => ({
    meta: [
      { title: "My Books — ShelfAI" },
      { name: "description", content: "Your current ShelfAI loans with due dates, plus your full reading history." },
      { property: "og:title", content: "My Books — ShelfAI" },
      { property: "og:description", content: "Track the books you have on loan and everything you have read." },
    ],
  }),
  component: MyBooksPage,
});

function MyBooksPage() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const doReturn = useServerFn(returnBook);

  const loans = useQuery({
    queryKey: ["my-borrowings", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyBorrowings(userId!),
  });

  const returnMutation = useMutation({
    mutationFn: (borrowingId: string) => doReturn({ data: { borrowingId, verification: "manual" } }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["my-borrowings"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      void queryClient.invalidateQueries({ queryKey: ["book"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
    onError: () => toast.error("Could not complete the return. Please try again."),
  });

  if (loans.isPending) return <ReaderPage title="My Books"><LoadingState label="Loading your loans…" /></ReaderPage>;
  if (loans.isError)
    return (
      <ReaderPage title="My Books">
        <ErrorState description="We could not load your loans." onRetry={() => void loans.refetch()} />
      </ReaderPage>
    );

  const rows = loans.data ?? [];
  const current = rows.filter((r) => r.status === "borrowed");
  const history = rows.filter((r) => r.status !== "borrowed");

  return (
    <ReaderPage title="My Books" description="Everything you have on loan right now, and everything you've read before.">
      <section aria-labelledby="current-loans" className="mb-10">
        <h2 id="current-loans" className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
          <BookOpen className="size-5 text-accent-foreground" aria-hidden="true" /> Currently borrowed ({current.length})
        </h2>
        {current.length === 0 ? (
          <EmptyState
            title="No books on loan"
            description="Browse the library and borrow a book to see it here."
            icon={BookOpen}
            action={
              <Link to="/library" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Explore the library
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {current.map((row) => (
              <LoanRow
                key={row.id}
                row={row}
                action={
                  <button
                    type="button"
                    disabled={returnMutation.isPending}
                    onClick={() => returnMutation.mutate(row.id)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {returnMutation.isPending ? "Returning…" : "Return book"}
                  </button>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reading-history">
        <h2 id="reading-history" className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
          <History className="size-5 text-accent-foreground" aria-hidden="true" /> Reading history ({history.length})
        </h2>
        {history.length === 0 ? (
          <EmptyState title="No reading history yet" description="Books you return will appear here." icon={History} />
        ) : (
          <ul className="space-y-3">
            {history.map((row) => (
              <LoanRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </ReaderPage>
  );
}

function LoanRow({ row, action }: { row: BorrowingRow; action?: React.ReactNode }) {
  const book = row.books;
  const due = new Date(row.due_date);
  const overdue = row.status === "borrowed" && due.getTime() < Date.now();

  return (
    <li className="surface flex flex-wrap items-center gap-4 p-3">
      <div className="w-16 shrink-0">
        <CoverArt title={book?.title ?? "Book"} author={book?.author ?? ""} url={book?.cover_url ?? null} />
      </div>
      <div className="min-w-40 flex-1">
        <p className="font-bold text-primary">
          {book ? (
            <Link to="/books/$bookId" params={{ bookId: book.id }} className="hover:underline">
              {book.title}
            </Link>
          ) : (
            "Unknown book"
          )}
        </p>
        <p className="text-sm text-muted-foreground">{book?.author}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Borrowed {new Date(row.borrowed_at).toLocaleDateString()}
          {row.returned_at ? ` · Returned ${new Date(row.returned_at).toLocaleDateString()}` : null}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {row.status === "borrowed" ? (
          <span className={overdue ? "text-sm font-bold text-destructive" : "text-sm font-semibold text-muted-foreground"}>
            {overdue ? "Overdue" : "Due"} {due.toLocaleDateString()}
          </span>
        ) : (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Returned
          </span>
        )}
        {action}
      </div>
    </li>
  );
}
