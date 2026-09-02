import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/brand";
import { useSession } from "@/hooks/useSession";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "register";

export function AuthPanel({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/library", replace: true });
  }, [loading, session, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then log in.");
          return;
        }
        toast.success("Welcome to ShelfAI");
        navigate({ to: "/library" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/library" });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setBusy(false);
      setNotice("Google sign-in is unavailable right now.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/library" });
  };

  const forgot = async () => {
    if (!email) {
      setNotice("Enter your email first, then choose Forgot password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setNotice(error ? error.message : "Password reset link sent — check your inbox.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <LibraryBackdrop />
      <div className="glass-card relative w-full max-w-md p-7 sm:p-9">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-sm font-medium text-muted-foreground">Your intelligent library companion</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" ? (
            <Field label="Full name" id="name">
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className={inputCls}
                placeholder="Aisha Perera"
              />
            </Field>
          ) : null}

          <Field label={mode === "login" ? "Email / Username" : "Email"} id="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" id="password">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputCls}
              placeholder="••••••••"
            />
          </Field>

          {mode === "login" ? (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-border accent-[oklch(0.71_0.086_72)]"
                />
                Remember me
              </label>
              <button type="button" onClick={forgot} className="font-semibold text-accent-foreground hover:underline">
                Forgot password?
              </button>
            </div>
          ) : null}

          {notice ? (
            <p role="status" className="rounded-lg border border-border bg-card/80 px-3 py-2 text-sm text-primary">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="w-full rounded-xl border border-border bg-card/80 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-card disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Link to="/register" className="font-bold text-accent-foreground hover:underline">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link to="/" className="font-bold text-accent-foreground hover:underline">
                Login
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card/85 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Subtle warm bookshelf backdrop with soft gold glow (login only). */
function LibraryBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-background">
      <div className="absolute inset-0 opacity-[0.5] blur-[2px]">
        <div className="flex h-full flex-col justify-evenly gap-6 px-6 py-10">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-end gap-1.5 border-b-4 border-[oklch(0.42_0.03_45/45%)] pb-1">
              {Array.from({ length: 34 }).map((_, i) => (
                <span
                  key={i}
                  className="block rounded-sm"
                  style={{
                    width: `${8 + ((i * 7 + row * 5) % 12)}px`,
                    height: `${46 + ((i * 13 + row * 11) % 46)}px`,
                    backgroundColor: [
                      "oklch(0.44 0.06 60)",
                      "oklch(0.36 0.03 35)",
                      "oklch(0.5 0.07 72)",
                      "oklch(0.4 0.05 150)",
                      "oklch(0.42 0.06 25)",
                    ][(i + row) % 5],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,oklch(0.71_0.086_72/22%),transparent_60%)]" />
      <div className="absolute inset-0 bg-[oklch(0.968_0.008_75/72%)] backdrop-blur-[3px]" />
    </div>
  );
}
