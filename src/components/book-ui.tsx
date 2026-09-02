import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";

import { CoverArt } from "@/components/brand";
import { cn } from "@/lib/utils";

export type BookRow = {
  id: string;
  book_code: string;
  title: string;
  author: string;
  genre: string;
  rating: number | null;
  cover_url?: string | null;
  description?: string | null;
  publication_year?: number | null;
  isbn?: string | null;
  total_copies: number;
  available_copies: number;
  section: string;
  shelf_label: string;
  row_no: number;
  position_no: number;
};

export type Availability = "available" | "borrowed" | "reserved";

export function availabilityOf(book: Pick<BookRow, "available_copies" | "total_copies">): Availability {
  if (book.available_copies > 0) return "available";
  return book.total_copies > 0 ? "borrowed" : "reserved";
}

export function AvailabilityBadge({
  book,
  className,
}: {
  book: Pick<BookRow, "available_copies" | "total_copies">;
  className?: string;
}) {
  const status = availabilityOf(book);
  const map = {
    available: { label: "Available", cls: "bg-success/12 text-success border-success/30", dot: "bg-success" },
    borrowed: { label: "Borrowed", cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
    reserved: { label: "Reserved", cls: "bg-accent/15 text-accent-foreground border-accent/40", dot: "bg-accent" },
  } as const;
  const item = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        item.cls,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", item.dot)} aria-hidden="true" />
      {item.label}
    </span>
  );
}

export function ShelfTag({ book, className }: { book: Pick<BookRow, "shelf_label">; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-accent-foreground", className)}>
      <MapPin className="size-3.5 text-accent" aria-hidden="true" />
      Shelf {book.shelf_label}
    </span>
  );
}

export function Rating({ value }: { value: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
      {Number(value ?? 0).toFixed(1)}
    </span>
  );
}

export function BookCard({
  book,
  footer,
  badge,
}: {
  book: BookRow;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <article className="surface surface-hover flex flex-col overflow-hidden p-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary">
        <CoverArt title={book.title} author={book.author} coverUrl={book.cover_url} />
        {badge ? <div className="absolute right-2 top-2">{badge}</div> : null}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-primary">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
            {book.genre}
          </span>
          <Rating value={book.rating} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <AvailabilityBadge book={book} />
          <ShelfTag book={book} />
        </div>
        {footer ?? (
          <Link
            to="/books/$bookId"
            params={{ bookId: book.id }}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Book
          </Link>
        )}
      </div>
    </article>
  );
}

export function LocationPath({
  book,
  className,
}: {
  book: Pick<BookRow, "section" | "shelf_label" | "row_no" | "position_no">;
  className?: string;
}) {
  const steps = [
    { label: "Section", value: book.section },
    { label: "Shelf", value: book.shelf_label },
    { label: "Row", value: String(book.row_no) },
    { label: "Position", value: String(book.position_no) },
  ];
  return (
    <dl className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {steps.map((step) => (
        <div key={step.label} className="rounded-xl border border-border bg-secondary/60 px-3 py-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{step.label}</dt>
          <dd className="text-lg font-bold text-primary">{step.value}</dd>
        </div>
      ))}
    </dl>
  );
}
