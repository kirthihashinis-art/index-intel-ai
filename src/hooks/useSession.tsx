import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Role = "user" | "librarian";

type Profile = {
  id: string;
  name: string;
  email: string;
  interests: string[];
  favorite_genres: string[];
  reading_preferences: string;
};

type SessionState = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  role: Role | null;
  isLibrarian: boolean;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
      queryClient.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user?.id;

  const { data } = useQuery({
    queryKey: ["session-identity", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      const roles = (roleRes.data ?? []).map((r) => r.role as Role);
      return {
        profile: (profileRes.data as Profile | null) ?? null,
        role: roles.includes("librarian") ? ("librarian" as Role) : ("user" as Role),
      };
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        profile: data?.profile ?? null,
        role: data?.role ?? null,
        isLibrarian: data?.role === "librarian",
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
