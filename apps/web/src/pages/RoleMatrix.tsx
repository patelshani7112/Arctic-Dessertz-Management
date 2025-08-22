import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Locations,
  Users,
  UserLocationRoles,
  Roles,
  RoleActions,
  Me,
} from "../lib/api";
import { supabase } from "../lib/supabase";
import { Select } from "../components/ui/Select";

export default function RoleMatrixPage() {
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const locQ = useQuery({ queryKey: ["locations"], queryFn: Locations.list });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: Roles.list });
  const ulrQ = useQuery({ queryKey: ["ulr"], queryFn: UserLocationRoles.list });
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => Users.list() });

  const assign = useMutation({
    mutationFn: ({
      user_id,
      location_id,
      new_role,
    }: {
      user_id: string;
      location_id: string;
      new_role: string;
    }) => RoleActions.assign(user_id, location_id, new_role),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ulr"] }),
        qc.invalidateQueries({ queryKey: ["users"] }),
      ]);
    },
  });

  if (
    locQ.isLoading ||
    usersQ.isLoading ||
    rolesQ.isLoading ||
    ulrQ.isLoading ||
    meQ.isLoading
  )
    return <div className="p-6">Loading…</div>;
  if (locQ.error || usersQ.error || rolesQ.error || ulrQ.error || meQ.error)
    return <div className="p-6 text-red-600">Error loading data.</div>;

  const me = meQ.data!,
    locations = locQ.data!,
    users = usersQ.data!,
    roles = rolesQ.data!,
    ulr = ulrQ.data!;
  const roleLookup = new Map(
    ulr.map((r) => [r.user_id + ":" + r.location_id, r.role_key])
  );

  return (
    <div className="p-6 space-y-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Role Matrix</h1>
        <button
          className="text-sm underline"
          onClick={async () => {
            await supabase.auth.signOut();
            location.href = "/login";
          }}
        >
          Sign out
        </button>
      </div>
      <div className="text-sm text-gray-600">
        Signed in as <strong>{me.full_name}</strong>{" "}
        {me.is_global_admin ? "(Admin)" : ""}
      </div>
      <div className="w-full overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left sticky left-0 bg-white z-10">
                User
              </th>
              {locations.map((loc) => (
                <th key={loc.id} className="border px-2 py-1">
                  {loc.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="odd:bg-gray-50">
                <td className="border px-2 py-1 sticky left-0 bg-white z-10">
                  <div className="font-medium">{u.full_name}</div>
                  <div className="text-xs text-gray-600">{u.email}</div>
                </td>
                {locations.map((loc) => {
                  const key = u.user_id + ":" + loc.id;
                  const current = roleLookup.get(key);
                  const isSelf = me.user_id === u.user_id;
                  const disabled = !me.is_global_admin && isSelf; // UI guard; server enforces anyway
                  return (
                    <td key={loc.id} className="border px-2 py-1">
                      <Select
                        value={current}
                        options={roles}
                        disabled={disabled || assign.isPending}
                        onChange={(newRole) =>
                          assign.mutate({
                            user_id: u.user_id,
                            location_id: loc.id,
                            new_role: newRole,
                          })
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assign.isPending && <div className="text-sm text-gray-600">Saving…</div>}
      {"error" in (assign as any) && (assign as any).error ? (
        <div className="text-sm text-red-600">
          Error: {(assign as any).error?.message || "Role change failed"}
        </div>
      ) : null}
      <p className="text-xs text-gray-500">
        Permissions are enforced server-side via RPC + RLS.
      </p>
    </div>
  );
}
