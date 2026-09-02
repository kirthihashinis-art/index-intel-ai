import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, Navigation } from "lucide-react";

import { AvailabilityBadge, LocationPath } from "@/components/book-ui";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ShelfMap } from "@/components/shelf-map";
import { fetchBook, fetchShelves } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/locate/$bookId")({
  head: () => ({
    meta: [
      { title: "Book Location — ShelfAI" },
      { name: "description", content: "See the exact section, shelf, row and position of a book and navigate to it on the library floor." },
      { property: "og:title", content: "Book Location — ShelfAI" },
      { property: "og:description", content: "Section, shelf, row and position — then walk straight to the book." },
    ],
  }),
  component: LocatePage,
});

function LocatePage() {
  const { bookId } = Route.useParams();
  const [navigating, setNavigating] = useState(false);
  const book = useQuery({ queryKey: ["book", bookId], queryFn: () => fetchBook(bookId) });
  const shelves = useQuery({ queryKey: ["shelves"], queryFn: fetchShelves });

  if (book.isPending) {
    return (
      <ReaderPage title="Book Location">
        <LoadingState label="Locating the book…" />
      </ReaderPage>
    );
  }
  if (book.isError) {
    return (
      <ReaderPage title="Book Location">
        <ErrorState onRetry={() => void book.refetch()} />
      </ReaderPage>
    );
  }
  if (!book.data) {
    return (
      <ReaderPage title="Book Location">
        <EmptyState title="Book not found" />
      </ReaderPage>
    );
  }

  const data = book.data;
  const steps = [
    `Section ${data.section}`,
    `Shelf ${data.shelf_label}`,
    `Row ${data.row_no}`,
    `Position ${data.position_no}`,
  ];

  return (
    <ReaderPage title="Book Location" description={`${data.title} — ${data.author}`}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold text-primary">{data.title}</h2>
            <AvailabilityBadge book={data} />
          </div>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step} className="flex flex-col items-start gap-2">
                <span
                  className={
                    index === steps.length - 1
                      ? "rounded-xl bg-accent px-4 py-2.5 text-sm font-extrabold text-accent-foreground"
                      : "rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm font-bold text-primary"
                  }
                >
                  {step}
                </span>
                {index < steps.length - 1 ? (
                  <ArrowDown className="ml-4 size-4 text-muted-foreground" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>

          <LocationPath book={data} className="mt-5" />

          <button
            type="button"
            onClick={() => setNavigating(true)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Navigation className="size-4 text-accent" aria-hidden="true" /> Start Navigation
          </button>
          {navigating ? (
            <p role="status" className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent-foreground">
              Walk in from the Entrance, turn into Section {data.section}, stop at Shelf {data.shelf_label}, then look at
              Row {data.row_no}, Position {data.position_no}.
            </p>
          ) : null}
        </div>

        <div>
          {shelves.isPending ? (
            <LoadingState label="Loading library map…" />
          ) : (
            <ShelfMap shelves={shelves.data ?? []} targetShelf={data.shelf_label} />
          )}
        </div>
      </div>
    </ReaderPage>
  );
}
