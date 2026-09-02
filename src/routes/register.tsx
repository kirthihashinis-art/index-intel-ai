import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "@/components/auth-panel";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your ShelfAI account" },
      {
        name: "description",
        content: "Join ShelfAI to borrow books, get AI recommendations from the real catalogue and return books to the right shelf.",
      },
      { property: "og:title", content: "Create your ShelfAI account" },
      { property: "og:description", content: "Join ShelfAI — Discover. Locate. Return." },
    ],
  }),
  ssr: false,
  component: () => <AuthPanel mode="register" />,
});
