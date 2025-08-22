// apps/web/src/lib/useSession.ts
import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Returns { session, ready }. While ready === false, don't redirect. */
export function useSessionState() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    // initial check
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });

    // keep session in sync (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setReady(true);
      }
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, ready };
}
