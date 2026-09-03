import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { BookCard } from "@/components/book-ui";
import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { fetchMyFavorites, toggleFavorite } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites — ShelfAI" },
      { name: "description", content: "The ShelfAI books you saved to your favorites, with live availability and shelf numbers." },
      { property: "og:title", content: "Favorites — ShelfAI" },
      { property: "og:description", content: "Your saved ShelfAI books, ready to borrow." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const favorites = useQuery({
    queryKey: ["my-favorites", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyFavorites(userId!),
  });

  const remove = useMutation({
    mutationFn: (bookId: string) => toggleFavorite(bookId, userId!, true),
    onSuccess: () => {
      toast.success("Removed from favorites");
      void queryClient.invalidateQueries({ queryKey: ["my-favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
    onError: () => toast.error("Could not update favorites. Please try again."),
  });

  return (
    <ReaderPage title="My Favorites" description="Books you saved for later — synced to your account.">
      {favorites.isPending ? (
        <SkeletonGrid count={4} />
      ) : favorites.isError ? (
        <ErrorState description="We could not load your favorites." onRetry={() => void favorites.refetch()} />
      ) : (favorites.data ?? []).length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Tap the heart on any book to save it here."
          icon={Heart}
          action={
            <Link to="/library" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Explore the library
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(favorites.data ?? []).map((row) =>
            row.book ? (
              <div key={row.favoriteId} className="space-y-2">
                <BookCard book={row.book} />
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(row.book!.id)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-secondary disabled:opacity-60"
                >
                  <Heart className="size-3.5 fill-current text-destructive" aria-hidden="true" /> Remove
                </button>
              </div>
            ) : null,
          )}
        </div>
      )}
    </ReaderPage>
  );
}
