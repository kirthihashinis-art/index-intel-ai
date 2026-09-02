import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — ShelfAI" },
      { name: "description", content: "Choose a new password for your ShelfAI library account." },
      { property: "og:title", content: "Set a new password — ShelfAI" },
      { property: "og:description", content: "Recover access to your ShelfAI account." },
    ],
  }),
  ssr: false,
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setNotice(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/library" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="surface w-full max-w-md p-7">
        <Logo size="lg" />
        <h1 className="mt-5 text-xl font-bold text-primary">Set a new password</h1>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          {notice ? <p className="text-sm text-destructive">{notice}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
