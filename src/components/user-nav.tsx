import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Bookmark, Heart, Home, LogOut, RotateCcw, Search, Shield, Sparkles, User } from "lucide-react";

import { Logo } from "@/components/brand";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/library", label: "Home", icon: Home },
  { to: "/recommendations", label: "AI Recommendations", icon: Sparkles },
  { to: "/search", label: "Search Books", icon: Search },
  { to: "/borrow", label: "Borrow Books", icon: BookPlus },
  { to: "/my-books", label: "My Books", icon: Bookmark },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/return", label: "Return Book", icon: RotateCcw },
] as const;

export function useUnreadCount() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["unread-notifications", session?.user?.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
  });
}

export function UserNav() {
  const { profile, isLibrarian, signOut } = useSession();
  const { data: unread } = useUnreadCount();
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/library" aria-label="ShelfAI home" className="shrink-0">
            <span className="hidden sm:block">
              <Logo className="[&_span]:text-primary-foreground" />
            </span>
            <span className="sm:hidden">
              <Logo size="sm" className="[&_span]:text-primary-foreground" />
            </span>
          </Link>

          <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-primary-foreground/75 transition-colors hover:bg-white/10 hover:text-primary-foreground"
                activeProps={{ className: "bg-white/10 !text-accent" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {isLibrarian ? (
              <Link
                to="/admin/dashboard"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-white/10 sm:flex"
              >
                <Shield className="size-4" aria-hidden="true" /> Admin
              </Link>
            ) : null}
            <Link
              to="/notifications"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              className="relative rounded-lg p-2 text-primary-foreground/85 transition-colors hover:bg-white/10"
            >
              <Bell className="size-5" aria-hidden="true" />
              {unread ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10"
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <User className="size-4" aria-hidden="true" />
              </span>
              <span className="hidden max-w-28 truncate text-sm font-semibold md:block">
                {profile?.name || "Reader"}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate({ to: "/" }))}
              aria-label="Log out"
              className="rounded-lg p-2 text-primary-foreground/70 transition-colors hover:bg-white/10"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Main mobile"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      >
        <ul className="flex items-stretch justify-between px-1 py-1">
          {LINKS.map((link) => (
            <li key={link.to} className="flex-1">
              <Link
                to={link.to}
                className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold text-muted-foreground"
                activeProps={{ className: "!text-accent-foreground bg-accent/12" }}
              >
                <link.icon className="size-5" aria-hidden="true" />
                <span className="truncate">{link.label.replace("AI Recommendations", "AI").replace("Search Books", "Search").replace("Return Book", "Return")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function PageShell({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl px-4 pb-28 pt-8 lg:pb-16", className)}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}
