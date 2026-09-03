import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { CoverArt } from "@/components/brand";
import { LocationPath } from "@/components/book-ui";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { returnBook } from "@/lib/library.functions";
import { fetchMyBorrowings } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/return")({
  head: () => ({
    meta: [
      { title: "Return a Book — ShelfAI" },
      { name: "description", content: "Confirm a ShelfAI return: shelve the book at its exact position and close the loan." },
      { property: "og:title", content: "Return a Book — ShelfAI" },
      { property: "og:description", content: "Close your ShelfAI loan and put the book back in the right place." },
    ],
  }),
  component: ReturnPage,
});

function ReturnPage() {
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

  if (loans.isPending) return <ReaderPage title="Return a Book"><LoadingState label="Loading your loans…" /></ReaderPage>;
  if (loans.isError)
    return (
      <ReaderPage title="Return a Book">
        <ErrorState description="We could not load your loans." onRetry={() => void loans.refetch()} />
      </ReaderPage>
    );

  const current = (loans.data ?? []).filter((r) => r.status === "borrowed");

  return (
    <ReaderPage
      title="Return a Book"
      description="Place the book back at the shelf position shown, then confirm the return."
    >
      {current.length === 0 ? (
        <EmptyState
          title="Nothing to return"
          description="You have no books on loan right now."
          icon={RotateCcw}
          action={
            <Link to="/library" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Explore the library
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {current.map((row) => (
            <li key={row.id} className="surface flex flex-wrap items-center gap-4 p-3">
              <div className="w-16 shrink-0">
                <CoverArt
                  title={row.books?.title ?? "Book"}
                  author={row.books?.author ?? ""}
                  coverUrl={row.books?.cover_url ?? null}
                />
              </div>
              <div className="min-w-40 flex-1">
                <p className="font-bold text-primary">{row.books?.title ?? "Unknown book"}</p>
                <p className="text-sm text-muted-foreground">{row.books?.author}</p>
                {row.books ? <LocationPath book={row.books} className="mt-1" /> : null}
              </div>
              <button
                type="button"
                disabled={returnMutation.isPending}
                onClick={() => returnMutation.mutate(row.id)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {returnMutation.isPending ? "Returning…" : "Confirm return"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </ReaderPage>
  );
}
