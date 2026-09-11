import { BookOpen, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** ShelfAI mark: open book + shelf line + AI sparkle. */
export function Logo({
  className,
  size = "md",
  admin = false,
  tagline = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  admin?: boolean;
  tagline?: boolean;
}) {
  const dims = size === "lg" ? "size-11" : size === "sm" ? "size-8" : "size-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-xl bg-primary text-primary-foreground",
          dims,
        )}
        aria-hidden="true"
      >
        <BookOpen className="size-1/2" strokeWidth={2.2} />
        <Sparkles className="absolute -right-1 -top-1 size-3.5 text-accent" strokeWidth={2.6} />
        <span className="absolute bottom-1 h-px w-1/2 rounded-full bg-accent/70" />
      </span>
      <span className="leading-tight">
        <span className={cn("block font-extrabold tracking-tight text-primary", text)}>
          Shelf<span className="text-accent">AI</span>
          {admin ? <span className="ml-1 text-sm font-semibold text-muted-foreground">— Admin</span> : null}
        </span>
        {tagline ? (
          <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Discover. Locate. Return.
          </span>
        ) : null}
      </span>
    </div>
  );
}

const COVER_TONES = [
  "from-[oklch(0.34_0.02_35)] to-[oklch(0.26_0.015_30)]",
  "from-[oklch(0.44_0.06_60)] to-[oklch(0.3_0.03_40)]",
  "from-[oklch(0.4_0.05_150)] to-[oklch(0.27_0.02_160)]",
  "from-[oklch(0.42_0.06_25)] to-[oklch(0.28_0.03_20)]",
  "from-[oklch(0.5_0.07_72)] to-[oklch(0.32_0.03_60)]",
];

/** Typographic cover artwork — used when a book has no cover image. */
export function CoverArt({
  title,
  author,
  coverUrl,
  className,
}: {
  title: string;
  author: string;
  coverUrl?: string | null | undefined;
  className?: string;
}) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`Cover of ${title} by ${author}`}
        loading="lazy"
        className={cn("h-full w-full rounded-lg object-cover", className)}
      />
    );
  }
  const tone = COVER_TONES[Math.abs(hash(title)) % COVER_TONES.length];
  return (
    <div
      role="img"
      aria-label={`Cover of ${title} by ${author}`}
      className={cn(
        "flex h-full w-full flex-col justify-between rounded-lg bg-gradient-to-br p-3 text-left",
        tone,
        className,
      )}
    >
      <span className="h-1 w-8 rounded-full bg-accent/80" aria-hidden="true" />
      <span className="space-y-1">
        <span className="line-clamp-3 block text-sm font-bold leading-snug text-[oklch(0.97_0.008_75)]">
          {title}
        </span>
        <span className="block text-[11px] font-medium text-[oklch(0.85_0.02_75)]">{author}</span>
      </span>
    </div>
  );
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h << 5) - h + value.charCodeAt(i);
  return h;
}
