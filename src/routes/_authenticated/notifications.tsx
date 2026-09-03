import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { ReaderPage } from "@/components/reader-page";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ShelfAI" },
      { name: "description", content: "Borrow confirmations, due-date reminders and reservation updates from ShelfAI." },
      { property: "og:title", content: "Notifications — ShelfAI" },
      { property: "og:description", content: "Your ShelfAI borrow, return and reservation updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchNotifications(userId!),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId!).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  return (
    <ReaderPage
      title="Notifications"
      description="Borrow confirmations, due dates and reservation updates."
      actions={
        (list.data ?? []).some((n) => !n.read) ? (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold text-primary hover:bg-secondary"
          >
            Mark all as read
          </button>
        ) : null
      }
    >
      {list.isPending ? (
        <LoadingState label="Loading notifications…" />
      ) : list.isError ? (
        <ErrorState description="We could not load your notifications." onRetry={() => void list.refetch()} />
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState title="No notifications" description="Borrow or reserve a book and updates will show up here." icon={Bell} />
      ) : (
        <ul className="space-y-2">
          {(list.data ?? []).map((n) => (
            <li key={n.id} className={`surface p-4 ${n.read ? "" : "border-accent/50"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-primary">{n.title}</p>
                <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </ReaderPage>
  );
}
