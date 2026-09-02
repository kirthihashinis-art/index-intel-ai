import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "@/components/auth-panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — ShelfAI" },
      {
        name: "description",
        content: "Sign in to ShelfAI, your intelligent library companion for discovering, locating and returning books.",
      },
      { property: "og:title", content: "Login — ShelfAI" },
      { property: "og:description", content: "Your intelligent library companion. Discover. Locate. Return." },
    ],
  }),
  ssr: false,
  component: () => <AuthPanel mode="login" />,
});
