import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "@/components/auth-panel";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ShelfAI" },
      { name: "description", content: "Sign in to ShelfAI to browse the library, get AI recommendations and return books." },
      { property: "og:title", content: "Sign in — ShelfAI" },
      { property: "og:description", content: "Sign in to your ShelfAI library account." },
    ],
  }),
  ssr: false,
  component: () => <AuthPanel mode="login" />,
});
