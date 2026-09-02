import { CoverArt } from "@/components/brand";

export { AvailabilityBadge } from "@/components/book-ui";
export type { BookRow } from "@/components/book-ui";

import type { BookRow } from "@/components/book-ui";

export function CoverArtCard({ book }: { book: BookRow }) {
  return <CoverArt title={book.title} author={book.author} coverUrl={book.cover_url} />;
}
