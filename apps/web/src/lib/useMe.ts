import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { Me } from "./api";

export function useMe() {
  const qc = useQueryClient();

  // When auth state changes (login/logout/token refresh), refetch "me"
  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["me"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  // Always fetch fresh; no stale cache
  return useQuery({
    queryKey: ["me"],
    queryFn: Me.get,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000, // keep it fresh
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0,
  });
}
