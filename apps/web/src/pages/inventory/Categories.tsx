// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { categoriesApi } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";
// import { useMe } from "../../lib/useMe";

// export default function CategoriesPage() {
//   const qc = useQueryClient();
//   const { data: me } = useMe();
//   const isAdmin = !!me?.is_global_admin;

//   const { myLocations = [], activeId, setActiveId } = useActiveLocation(); // you already have this hook
//   const [selectedLoc, setSelectedLoc] = React.useState<string | null>(activeId || null);

//   React.useEffect(() => { if (activeId && !selectedLoc) setSelectedLoc(activeId); }, [activeId, selectedLoc]);

//   const { data: rows = [], isFetching } = useQuery({
//     enabled: !!selectedLoc,
//     queryKey: ["categories", selectedLoc],
//     queryFn: () => categoriesApi.list(selectedLoc!),
//   });

//   const [name, setName] = React.useState("");
//   const createMut = useMutation({
//     mutationFn: () => categoriesApi.create({ location_id: selectedLoc!, name }),
//     onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["categories", selectedLoc] }); },
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, patch }: { id: string; patch: any }) => categoriesApi.update(id, patch),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", selectedLoc] }),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => categoriesApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", selectedLoc] }),
//   });

//   const canEditHere = (locId: string) => {
//     if (isAdmin) return true;
//     const mine = myLocations.find(l => l.id === activeId);
//     return !!mine && mine.id === locId && (mine.my_role === "MANAGER");
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-xl font-semibold">📚 Categories</h1>

//       {/* Location picker (Admins can switch; Manager locked to active) */}
//       <div className="flex items-center gap-2">
//         <label className="text-sm text-gray-600">Location</label>
//         <select
//           className="border rounded px-2 py-1"
//           value={selectedLoc ?? ""}
//           onChange={(e) => {
//             const v = e.target.value || null;
//             setSelectedLoc(v);
//             // Optional: sync header’s active location if admin also wants header reflect it
//             if (isAdmin && v) setActiveId?.(v);
//           }}
//           disabled={!isAdmin}
//         >
//           {myLocations.map((l) => (
//             <option key={l.id} value={l.id}>{l.name}</option>
//           ))}
//         </select>
//         {!isAdmin && <span className="text-xs text-gray-500">Manager can edit only the active location.</span>}
//       </div>

//       {/* Create */}
//       <div className="border rounded-2xl p-4 space-y-3">
//         <div className="text-sm font-medium">Add category</div>
//         <div className="flex gap-2">
//           <input
//             className="border rounded px-3 py-2 w-72"
//             placeholder="Category name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />
//           <button
//             className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
//             onClick={() => createMut.mutate()}
//             disabled={!selectedLoc || !name.trim() || createMut.isPending || !canEditHere(selectedLoc!)}
//           >
//             {createMut.isPending ? "Adding…" : "Add"}
//           </button>
//         </div>
//         {!canEditHere(selectedLoc || "") && <div className="text-xs text-amber-600">You don't have permission to modify this location.</div>}
//       </div>

//       {/* List */}
//       <div className="border rounded-2xl overflow-hidden">
//         <div className="px-4 py-3 border-b font-medium">Categories</div>
//         {isFetching ? (
//           <div className="p-4 text-sm text-gray-500">Loading…</div>
//         ) : rows.length === 0 ? (
//           <div className="p-4 text-sm text-gray-500">No categories yet.</div>
//         ) : (
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="text-left p-3">Name</th>
//                 <th className="text-left p-3">Active</th>
//                 <th className="text-right p-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((r: any) => {
//                 const canEdit = canEditHere(r.location_id);
//                 return (
//                   <tr key={r.id} className="border-t">
//                     <td className="p-3">
//                       <input
//                         className="border rounded px-2 py-1 w-full"
//                         defaultValue={r.name}
//                         onBlur={(e) => {
//                           const v = e.target.value.trim();
//                           if (v && v !== r.name && canEdit) {
//                             updateMut.mutate({ id: r.id, patch: { name: v } });
//                           } else {
//                             e.target.value = r.name;
//                           }
//                         }}
//                         disabled={!canEdit}
//                       />
//                     </td>
//                     <td className="p-3">
//                       <input
//                         type="checkbox"
//                         defaultChecked={r.is_active}
//                         onChange={(e) => canEdit && updateMut.mutate({ id: r.id, patch: { is_active: e.target.checked } })}
//                         disabled={!canEdit}
//                       />
//                     </td>
//                     <td className="p-3 text-right">
//                       <button
//                         className="px-3 py-1.5 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
//                         onClick={() => {
//                           if (!canEdit) return;
//                           if (confirm(`Delete category "${r.name}"?`)) deleteMut.mutate(r.id);
//                         }}
//                         disabled={!canEdit}
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }


import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../../lib/api/inventory";
import { useActiveLocation } from "../../lib/activeLocation";
import { useMe } from "../../lib/useMe";

function Spinner() {
  return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = !!me?.is_global_admin;

  const { myLocations = [], activeId, setActiveId } = useActiveLocation();
  const [selectedLoc, setSelectedLoc] = React.useState<string | null>(activeId || null);
  React.useEffect(() => { if (activeId && !selectedLoc) setSelectedLoc(activeId); }, [activeId, selectedLoc]);

  const { data: rows = [], isFetching } = useQuery({
    enabled: !!selectedLoc,
    queryKey: ["categories", selectedLoc],
    queryFn: () => categoriesApi.list(selectedLoc!),
  });

  const [name, setName] = React.useState("");
  const createMut = useMutation({
    mutationFn: () => categoriesApi.create({ location_id: selectedLoc!, name }),
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["categories", selectedLoc] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => categoriesApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", selectedLoc] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", selectedLoc] }),
  });

  const canEditHere = (locId: string) => {
    if (isAdmin) return true;
    const mine = myLocations.find(l => l.id === activeId);
    return !!mine && mine.id === locId && (mine.my_role === "MANAGER");
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
      {/* Title & controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Location</span>
            <select
              className="input"
              value={selectedLoc ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setSelectedLoc(v);
                if (isAdmin && v) setActiveId?.(v);
              }}
              disabled={!isAdmin}
            >
              {myLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create */}
      <div className="card p-4">
        <div className="text-sm font-medium mb-3">Add category</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input w-full sm:w-80"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="btn btn-primary inline-flex items-center gap-2"
            onClick={() => createMut.mutate()}
            disabled={!selectedLoc || !name.trim() || createMut.isPending || !canEditHere(selectedLoc!)}
          >
            {createMut.isPending && <Spinner />}
            Add
          </button>
        </div>
        {!canEditHere(selectedLoc || "") && (
          <div className="text-xs text-amber-600 mt-2">You don’t have permission to modify this location.</div>
        )}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b font-medium">All categories</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Active</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr><td className="px-3 py-6 text-gray-500" colSpan={3}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-3 py-6 text-gray-500" colSpan={3}>No categories yet.</td></tr>
              ) : (
                rows.map((r: any, i: number) => {
                  const canEdit = canEditHere(r.location_id);
                  return (
                    <tr key={r.id} className={i % 2 ? "bg-gray-50/60" : "bg-white"}>
                      <td className="px-3 py-2">
                        <input
                          className="input w-full"
                          defaultValue={r.name}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== r.name && canEdit) {
                              updateMut.mutate({ id: r.id, patch: { name: v } });
                            } else {
                              e.target.value = r.name;
                            }
                          }}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            defaultChecked={r.is_active}
                            onChange={(e) => canEdit && updateMut.mutate({ id: r.id, patch: { is_active: e.target.checked } })}
                            disabled={!canEdit}
                          />
                          <span className="text-xs">{r.is_active ? "Active" : "Inactive"}</span>
                        </label>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="btn"
                          onClick={() => {
                            if (!canEdit) return;
                            if (confirm(`Delete category “${r.name}”?`)) deleteMut.mutate(r.id);
                          }}
                          disabled={!canEdit}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
