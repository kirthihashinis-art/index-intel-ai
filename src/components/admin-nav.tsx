import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BookCopy,
  Bell,
  Brain,
  LayoutDashboard,
  Library,
  LogOut,
  RotateCcw,
  ScanLine,
  Settings,
  TriangleAlert,
} from "lucide-react";

import { Logo } from "@/components/brand";
import { useUnreadCount } from "@/components/user-nav";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/books", label: "Books", icon: BookCopy },
  { to: "/admin/shelves", label: "Shelves", icon: Library },
  { to: "/admin/borrowing", label: "Borrowing", icon: BookCopy },
  { to: "/admin/returns", label: "Returns", icon: RotateCcw },
  { to: "/admin/scanner", label: "AI Shelf Scanner", icon: ScanLine },
  { to: "/admin/misplaced", label: "Misplaced Books", icon: TriangleAlert },
  { to: "/admin/ai-system", label: "AI System", icon: Brain },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { profile, signOut } = useSession();
  const { data: unread } = useUnreadCount();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground lg:flex">
        <Link to="/admin/dashboard" className="mb-6 px-2">
          <Logo admin className="[&_span]:text-sidebar-foreground" />
        </Link>
        <nav aria-label="Librarian" className="flex-1 space-y-0.5">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-accent" }}
            >
              <link.icon className="size-4" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 space-y-1 border-t border-sidebar-border pt-3">
          <Link
            to="/library"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            Reader view
          </Link>
          <button
            type="button"
            onClick={() => void signOut().then(() => navigate({ to: "/" }))}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:justify-end">
          <Link to="/admin/dashboard" className="lg:hidden">
            <Logo size="sm" admin />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-secondary" aria-label="Notifications">
              <Bell className="size-5 text-primary" aria-hidden="true" />
              {unread ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <span className="hidden text-sm font-semibold text-primary sm:block">
              {profile?.name || "Librarian"}
            </span>
          </div>
        </header>

        <nav aria-label="Librarian mobile" className="overflow-x-auto border-b border-border bg-card px-2 py-2 lg:hidden">
          <ul className="flex gap-1">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  activeProps={{ className: "bg-accent/15 !text-accent-foreground" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className={cn("mx-auto w-full max-w-6xl flex-1 px-4 py-7")}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="page-title">{title}</h1>
              {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "gold" | "success" | "danger";
}) {
  const tones = {
    default: "text-primary",
    gold: "text-accent-foreground",
    success: "text-success",
    danger: "text-destructive",
  } as const;
  return (
    <div className="surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-extrabold", tones[tone])}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
