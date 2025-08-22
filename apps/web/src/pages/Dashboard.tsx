// apps/web/src/pages/Dashboard.tsx
import * as React from "react";
import { useActiveLocation } from "../lib/activeLocation";
import { useMe } from "../lib/useMe";

export default function Dashboard() {
  const { data: me } = useMe();
  const { myLocations, active } = useActiveLocation();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-sm text-gray-600">Signed in as</div>
          <div className="mt-1 text-lg font-semibold">{me?.full_name}</div>
          <div className="badge mt-2 border-brand-600 text-brand-600">
            {me?.is_global_admin ? "Global Admin" : "Staff"}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm text-gray-600">Active Location</div>
          <div className="mt-1 text-lg font-semibold">
            {active?.name || "—"}
          </div>
          <div className="text-xs text-gray-600">{active?.my_role || "—"}</div>
        </div>

        <div className="card p-5">
          <div className="text-sm text-gray-600">My Locations</div>
          <div className="mt-1 text-3xl font-bold">{myLocations.length}</div>
        </div>
      </div>
    </div>
  );
}
