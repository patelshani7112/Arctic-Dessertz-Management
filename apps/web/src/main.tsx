// import React from "react";
// import { createRoot } from "react-dom/client";
// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
//   Outlet,
//   useLocation,
// } from "react-router-dom";
// import { QueryClientProvider } from "@tanstack/react-query";
// import "./index.css";

// import { qc } from "./lib/queryClient";
// import { useSessionState } from "./lib/useSession";
// import { useMe } from "./lib/useMe";
// import { useActiveLocation } from "./lib/activeLocation";

// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import UsersPage from "./pages/Users";
// import LocationsPage from "./pages/Locations";
// import ProfilePage from "./pages/Profile";
// import ResetPasswordPage from "./pages/ResetPassword";

// import { AppShell } from "./components/layout/AppShell";
// import { ActiveLocationProvider } from "./lib/activeLocation";

// /* -------- Auth gate -------- */
// function Protected({ children }: { children: React.ReactNode }) {
//   const { session, ready } = useSessionState();
//   if (!ready) return <div className="p-6">Loading…</div>;
//   if (!session) return <Navigate to="/login" replace />;
//   return <>{children}</>;
// }

// /* -------- Permission helpers (active-location–aware) -------- */
// function usePermissions() {
//   const { data: me } = useMe();
//   const { myLocations = [], activeId } = useActiveLocation();

//   const isAdmin = !!me?.is_global_admin;
//   const myRoleAtActive =
//     myLocations.find((l) => l.id === activeId)?.my_role || null;
//   const isManagerAtActive = myRoleAtActive === "MANAGER";

//   const canUsers = isAdmin || isManagerAtActive;
//   const canLocations = isAdmin || isManagerAtActive;

//   return { isAdmin, isManagerAtActive, canUsers, canLocations };
// }

// function Guard({ allowed }: { allowed: boolean }) {
//   return allowed ? <Outlet /> : <Navigate to="/app" replace />;
// }

// function RequireUsersAccess() {
//   const { canUsers } = usePermissions();
//   return <Guard allowed={canUsers} />;
// }

// function RequireLocationsAccess() {
//   const { canLocations } = usePermissions();
//   return <Guard allowed={canLocations} />;
// }

// /* -------- Live redirect when access changes after header switch -------- */
// function LiveAccessEnforcer() {
//   const { pathname } = useLocation();
//   const { canUsers, canLocations } = usePermissions();

//   React.useEffect(() => {
//     const wantsUsers = pathname.startsWith("/app/users");
//     const wantsLocs = pathname.startsWith("/app/locations");
//     if ((wantsUsers && !canUsers) || (wantsLocs && !canLocations)) {
//       // Soft-redirect to dashboard
//       window.history.replaceState(null, "", "/app");
//       window.dispatchEvent(new PopStateEvent("popstate"));
//     }
//   }, [pathname, canUsers, canLocations]);

//   return null;
// }

// /* -------- Routes -------- */
// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route path="/reset-password" element={<ResetPasswordPage />} />

//       <Route
//         path="/app/*"
//         element={
//           <Protected>
//             <AppShell>
//               <LiveAccessEnforcer />
//               <Routes>
//                 <Route index element={<Dashboard />} />

//                 <Route element={<RequireUsersAccess />}>
//                   <Route path="users" element={<UsersPage />} />
//                 </Route>

//                 <Route element={<RequireLocationsAccess />}>
//                   <Route path="locations" element={<LocationsPage />} />
//                 </Route>

//                 <Route path="profile" element={<ProfilePage />} />
//               </Routes>
//             </AppShell>
//           </Protected>
//         }
//       />

//       {/* default redirect */}
//       <Route path="*" element={<Navigate to="/app" replace />} />
//     </Routes>
//   );
// }

// createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <QueryClientProvider client={qc}>
//       <ActiveLocationProvider>
//         <BrowserRouter>
//           <AppRoutes />
//         </BrowserRouter>
//       </ActiveLocationProvider>
//     </QueryClientProvider>
//   </React.StrictMode>
// );

import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import { qc } from "./lib/queryClient";
import { useSessionState } from "./lib/useSession";
import { useMe } from "./lib/useMe";
import { useActiveLocation } from "./lib/activeLocation";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import LocationsPage from "./pages/Locations";
import ProfilePage from "./pages/Profile";
import ResetPasswordPage from "./pages/ResetPassword";

// Inventory pages
import ItemsPage from "./pages/inventory/Items";
import CategoriesPage from "./pages/inventory/Categories";
import SuppliersPage from "./pages/inventory/Suppliers";

// Orders flow
import OrdersGeneral from "./pages/orders/General";
import OrdersReview from "./pages/orders/Review";
import OrdersPlaced from "./pages/orders/Placed";
import OrdersArchive from "./pages/orders/Archive";

import { AppShell } from "./components/layout/AppShell";
import { ActiveLocationProvider } from "./lib/activeLocation";

/* -------- Auth gate -------- */
function Protected({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSessionState();
  if (!ready) return <div className="p-6">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* -------- Permission helpers (active-location–aware) -------- */
function usePermissions() {
  const { data: me } = useMe();
  const { myLocations = [], activeId } = useActiveLocation();

  const isAdmin = !!me?.is_global_admin;
  const myRoleAtActive =
    myLocations.find((l) => l.id === activeId)?.my_role || null;
  const isManagerAtActive = myRoleAtActive === "MANAGER";

  const canUsers = isAdmin || isManagerAtActive;
  const canLocations = isAdmin || isManagerAtActive;

  return { isAdmin, isManagerAtActive, canUsers, canLocations };
}

function Guard({ allowed }: { allowed: boolean }) {
  return allowed ? <Outlet /> : <Navigate to="/app" replace />;
}

function RequireUsersAccess() {
  const { canUsers } = usePermissions();
  return <Guard allowed={canUsers} />;
}

function RequireLocationsAccess() {
  const { canLocations } = usePermissions();
  return <Guard allowed={canLocations} />;
}

/* -------- Live redirect when access changes after header switch -------- */
function LiveAccessEnforcer() {
  const { pathname } = useLocation();
  const { canUsers, canLocations } = usePermissions();

  React.useEffect(() => {
    const wantsUsers = pathname.startsWith("/app/users");
    const wantsLocs = pathname.startsWith("/app/locations");
    if ((wantsUsers && !canUsers) || (wantsLocs && !canLocations)) {
      window.history.replaceState(null, "", "/app");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [pathname, canUsers, canLocations]);

  return null;
}

/* -------- Routes -------- */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/app/*"
        element={
          <Protected>
            <AppShell>
              <LiveAccessEnforcer />
              <Routes>
                <Route index element={<Dashboard />} />

                <Route element={<RequireUsersAccess />}>
                  <Route path="users" element={<UsersPage />} />
                </Route>

                <Route element={<RequireLocationsAccess />}>
                  <Route path="locations" element={<LocationsPage />} />
                </Route>

                {/* Inventory (no extra guards; RLS + page logic handle permissions) */}

                <Route path="inventory/items" element={<ItemsPage />} />
                <Route path="inventory/categories" element={<CategoriesPage />} />
                <Route path="inventory/suppliers" element={<SuppliersPage />} />

                {/* Orders flow */}
                <Route path="orders/general" element={<OrdersGeneral />} />
                <Route path="orders/review" element={<OrdersReview />} />
                <Route path="orders/placed" element={<OrdersPlaced />} />
                <Route path="orders/archive" element={<OrdersArchive />} />

                <Route path="profile" element={<ProfilePage />} />
              </Routes>
            </AppShell>
          </Protected>
        }
      />

      {/* default redirect */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <ActiveLocationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ActiveLocationProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
