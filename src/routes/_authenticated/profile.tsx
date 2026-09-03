import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { ReaderPage } from "@/components/reader-page";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — ShelfAI" },
      { name: "description", content: "Update your ShelfAI reading interests and favorite genres to sharpen recommendations." },
      { property: "og:title", content: "My Profile — ShelfAI" },
      { property: "og:description", content: "Manage your ShelfAI account and reading preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, profile, role, signOut } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [interests, setInterests] = useState("");
  const [genres, setGenres] = useState("");
  const [prefs, setPrefs] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setInterests((profile.interests ?? []).join(", "));
    setGenres((profile.favorite_genres ?? []).join(", "));
    setPrefs(profile.reading_preferences ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const toList = (value: string) =>
        value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          interests: toList(interests),
          favorite_genres: toList(genres),
          reading_preferences: prefs,
        })
        .eq("id", session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["session-identity"] });
    },
    onError: () => toast.error("Could not save your profile. Please try again."),
  });

  return (
    <ReaderPage title="My Profile" description="Your account details and the preferences that guide AI recommendations.">
      <div className="surface max-w-2xl space-y-4 p-5">
        <div className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</span>
          <span className="font-semibold text-primary">{session?.user?.email}</span>
          <span className="text-xs text-muted-foreground">Role: {role ?? "user"}</span>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Labelled label="Full name" id="p-name">
            <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Labelled>
          <Labelled label="Interests (comma separated)" id="p-interests">
            <input id="p-interests" value={interests} onChange={(e) => setInterests(e.target.value)} className={inputCls} />
          </Labelled>
          <Labelled label="Favorite genres (comma separated)" id="p-genres">
            <input id="p-genres" value={genres} onChange={(e) => setGenres(e.target.value)} className={inputCls} />
          </Labelled>
          <Labelled label="Reading preferences" id="p-prefs">
            <textarea id="p-prefs" value={prefs} onChange={(e) => setPrefs(e.target.value)} rows={3} className={inputCls} />
          </Labelled>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate({ to: "/", replace: true }))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary"
            >
              <LogOut className="size-4" aria-hidden="true" /> Log out
            </button>
          </div>
        </form>
      </div>
    </ReaderPage>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none";

function Labelled({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
