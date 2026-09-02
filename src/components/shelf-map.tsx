import { DoorOpen } from "lucide-react";

import { cn } from "@/lib/utils";

type Shelf = { section: string; shelf_label: string };

/** Simple floor plan: entrance → sections → shelves, with the target shelf highlighted in gold. */
export function ShelfMap({
  shelves,
  targetShelf,
  className,
}: {
  shelves: Shelf[];
  targetShelf?: string;
  className?: string;
}) {
  const sections = [...new Set(shelves.map((s) => s.section))].sort();

  return (
    <div className={cn("surface p-4", className)}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground">
          <DoorOpen className="size-4" aria-hidden="true" /> Entrance
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">Reading floor</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section} className="rounded-xl border border-border bg-secondary/50 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Section {section}
            </p>
            <ul className="flex flex-wrap gap-2">
              {shelves
                .filter((s) => s.section === section)
                .map((shelf) => {
                  const active = shelf.shelf_label === targetShelf;
                  return (
                    <li key={shelf.shelf_label}>
                      <span
                        className={cn(
                          "inline-flex min-w-16 items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors",
                          active
                            ? "border-accent bg-accent text-accent-foreground shadow-[0_0_0_4px_oklch(0.71_0.086_72/25%)]"
                            : "border-border bg-card text-muted-foreground",
                        )}
                        aria-current={active ? "location" : undefined}
                      >
                        {shelf.shelf_label}
                        {active ? <span className="sr-only"> (destination)</span> : null}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      {targetShelf ? (
        <p className="mt-4 text-sm font-semibold text-primary">
          Route: Entrance <span aria-hidden="true">→</span> Section {targetShelf.split("-")[0]}{" "}
          <span aria-hidden="true">→</span> Shelf <span className="text-accent-foreground">{targetShelf}</span>
        </p>
      ) : null}
    </div>
  );
}
