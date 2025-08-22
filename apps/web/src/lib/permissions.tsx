import * as React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useMe } from "../lib/useMe";
import { useActiveLocation } from "../lib/activeLocation";

/** Centralized permission calc based on ACTIVE location */
export function usePermissions() {
  const { data: me } = useMe();
  const { myLocations = [], activeId } = useActiveLocation();

  const isAdmin = !!me?.is_global_admin;
  const myRoleAtActive =
    myLocations.find((l) => l.id === activeId)?.my_role || null;

  const isManagerAtActive = myRoleAtActive === "MANAGER";

  return {
    ready: true, // if your hooks expose loading flags, use them here
    isAdmin,
    isManagerAtActive,
    canUsers: isAdmin || isManagerAtActive,
    canLocations: isAdmin || isManagerAtActive,
  };
}

/** Generic guard used by specific guards below */
function Guard({
  allowed,
  redirectTo = "/app",
}: {
  allowed: boolean;
  redirectTo?: string;
}) {
  // While loading, you could return a small skeleton if needed
  return allowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

/** Only admins OR managers-at-active can view Users */
export function RequireUsersAccess() {
  const { canUsers } = usePermissions();
  return <Guard allowed={canUsers} />;
}

/** Only admins OR managers-at-active can view Locations */
export function RequireLocationsAccess() {
  const { canLocations } = usePermissions();
  return <Guard allowed={canLocations} />;
}

/**
 * Optional: live enforcement when active location changes.
 * If user is currently on /app/users or /app/locations and loses access,
 * immediately kick them back to /app.
 */
export function useLiveAccessEnforcement() {
  const { canUsers, canLocations } = usePermissions();
  const { pathname } = useLocation();

  React.useEffect(() => {
    const wantsUsers = pathname.startsWith("/app/users");
    const wantsLocations = pathname.startsWith("/app/locations");
    if ((wantsUsers && !canUsers) || (wantsLocations && !canLocations)) {
      // Use a soft navigation by updating window.location — or with navigate()
      window.history.replaceState(null, "", "/app");
      // force a re-render to actually navigate in Router
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [pathname, canUsers, canLocations]);
}
