import { supabase } from "@/integrations/supabase/client";
import type { BookRow } from "@/components/book-ui";

export const BOOK_FIELDS =
  "id, book_code, isbn, title, author, genre, description, cover_url, publication_year, rating, total_copies, available_copies, section, shelf_label, row_no, position_no";

export const GENRES = [
  "All",
  "Fiction",
  "Non-Fiction",
  "Science",
  "Technology",
  "History",
  "Mystery",
  "Thriller",
  "Self Development",
  "Programming",
] as const;

export const PAGE_SIZE = 12;

export async function fetchBooks({ genre, page }: { genre: string; page: number }) {
  let query = supabase
    .from("books")
    .select(BOOK_FIELDS, { count: "exact" })
    .order("title")
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (genre && genre !== "All") query = query.eq("genre", genre);
  const { data, error, count } = await query;
  if (error) throw error;
  return { books: (data ?? []) as BookRow[], total: count ?? 0 };
}

export async function searchBooks(term: string) {
  const q = term.trim();
  if (!q) return [] as BookRow[];
  const { data, error } = await supabase
    .from("books")
    .select(BOOK_FIELDS)
    .or(`title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%,genre.ilike.%${q}%,book_code.ilike.%${q}%`)
    .order("rating", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []) as BookRow[];
}

export async function fetchBook(id: string) {
  const { data, error } = await supabase.from("books").select(BOOK_FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as BookRow | null) ?? null;
}

export async function fetchShelves() {
  const { data, error } = await supabase
    .from("shelves")
    .select("id, section, shelf_label, rows_count, positions_per_row, description")
    .order("shelf_label");
  if (error) throw error;
  return data ?? [];
}

export async function fetchFavoriteIds() {
  const { data, error } = await supabase.from("favorites").select("book_id");
  if (error) throw error;
  return new Set((data ?? []).map((f) => f.book_id));
}

export async function toggleFavorite(bookId: string, userId: string, isFavorite: boolean) {
  if (isFavorite) {
    const { error } = await supabase.from("favorites").delete().eq("book_id", bookId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("favorites").insert({ book_id: bookId, user_id: userId });
  if (error) throw error;
  return true;
}
