// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { suppliersApi } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";
// import { useMe } from "../../lib/useMe";

// export default function SuppliersPage() {
//   const qc = useQueryClient();
//   const { data: me } = useMe();
//   const isAdmin = !!me?.is_global_admin;

//   const { myLocations = [], activeId, setActiveId } = useActiveLocation();
//   const [selectedLoc, setSelectedLoc] = React.useState<string | null>(activeId || null);
//   React.useEffect(() => { if (activeId && !selectedLoc) setSelectedLoc(activeId); }, [activeId, selectedLoc]);

//   const [q, setQ] = React.useState("");
//   const { data: rows = [], isFetching } = useQuery({
//     enabled: !!selectedLoc,
//     queryKey: ["suppliers", selectedLoc, q],
//     queryFn: () => suppliersApi.list(selectedLoc!, q),
//   });

//   const canEditHere = (locId: string) => {
//     if (isAdmin) return true;
//     const mine = myLocations.find(l => l.id === activeId);
//     return !!mine && mine.id === locId && (mine.my_role === "MANAGER");
//   };

//   const [form, setForm] = React.useState({
//     name: "", email: "", phone: "", payment_terms: "",
//     preferred_contact_method: "" as ""|"email"|"whatsapp",
//   });

//   const createMut = useMutation({
//     mutationFn: () => suppliersApi.create({
//       location_id: selectedLoc!, name: form.name, email: form.email || undefined, phone: form.phone || undefined,
//       payment_terms: form.payment_terms || undefined,
//       preferred_contact_method: (form.preferred_contact_method || undefined) as any,
//       is_active: true,
//     }),
//     onSuccess: () => {
//       setForm({ name: "", email: "", phone: "", payment_terms: "", preferred_contact_method: "" });
//       qc.invalidateQueries({ queryKey: ["suppliers", selectedLoc] });
//     },
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, patch }: { id: string; patch: any }) => suppliersApi.update(id, patch),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", selectedLoc] }),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => suppliersApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", selectedLoc] }),
//   });

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-xl font-semibold">🏷️ Suppliers</h1>

//       {/* Location + search */}
//       <div className="flex flex-wrap items-end gap-3">
//         <div className="flex items-center gap-2">
//           <label className="text-sm text-gray-600">Location</label>
//           <select
//             className="border rounded px-2 py-1"
//             value={selectedLoc ?? ""}
//             onChange={(e) => {
//               const v = e.target.value || null;
//               setSelectedLoc(v);
//               if (isAdmin && v) setActiveId?.(v);
//             }}
//             disabled={!isAdmin}
//           >
//             {myLocations.map((l) => (
//               <option key={l.id} value={l.id}>{l.name}</option>
//             ))}
//           </select>
//         </div>

//         <div className="flex items-center gap-2">
//           <input
//             className="border rounded px-3 py-2"
//             placeholder="Search name…"
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Create */}
//       <div className="border rounded-2xl p-4 space-y-3">
//         <div className="text-sm font-medium">Add supplier</div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//           <input className="border rounded px-3 py-2" placeholder="Name *"
//                  value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}/>
//           <input className="border rounded px-3 py-2" placeholder="Email"
//                  value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))}/>
//           <input className="border rounded px-3 py-2" placeholder="Phone"
//                  value={form.phone} onChange={e=>setForm(f=>({...f, phone: e.target.value}))}/>
//           <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Payment terms"
//                  value={form.payment_terms} onChange={e=>setForm(f=>({...f, payment_terms: e.target.value}))}/>
//           <select className="border rounded px-3 py-2"
//                   value={form.preferred_contact_method}
//                   onChange={e=>setForm(f=>({...f, preferred_contact_method: e.target.value as any}))}>
//             <option value="">Preferred contact…</option>
//             <option value="email">Email</option>
//             <option value="whatsapp">WhatsApp</option>
//           </select>
//         </div>
//         <button
//           className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
//           onClick={() => createMut.mutate()}
//           disabled={!selectedLoc || !form.name.trim() || createMut.isPending || !canEditHere(selectedLoc!)}
//         >
//           {createMut.isPending ? "Adding…" : "Add supplier"}
//         </button>
//         {!canEditHere(selectedLoc || "") && <div className="text-xs text-amber-600">You don't have permission to modify this location.</div>}
//       </div>

//       {/* List */}
//       <div className="border rounded-2xl overflow-hidden">
//         <div className="px-4 py-3 border-b font-medium">Suppliers</div>
//         {isFetching ? (
//           <div className="p-4 text-sm text-gray-500">Loading…</div>
//         ) : rows.length === 0 ? (
//           <div className="p-4 text-sm text-gray-500">No suppliers yet.</div>
//         ) : (
//           <div className="divide-y">
//             {rows.map((s: any) => {
//               const canEdit = canEditHere(s.location_id);
//               return (
//                 <div key={s.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
//                   <div className="md:col-span-2">
//                     <input
//                       className="border rounded px-2 py-1 w-full"
//                       defaultValue={s.name}
//                       onBlur={(e) => {
//                         const v = e.target.value.trim();
//                         if (v && v !== s.name && canEdit) updateMut.mutate({ id: s.id, patch: { name: v } });
//                         else e.target.value = s.name;
//                       }}
//                       disabled={!canEdit}
//                     />
//                     <div className="text-[11px] text-gray-500">{s.email || "—"} · {s.phone || "—"}</div>
//                   </div>
//                   <input
//                     className="border rounded px-2 py-1"
//                     defaultValue={s.email || ""}
//                     onBlur={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { email: e.target.value || null } })}
//                     placeholder="email"
//                     disabled={!canEdit}
//                   />
//                   <input
//                     className="border rounded px-2 py-1"
//                     defaultValue={s.phone || ""}
//                     onBlur={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { phone: e.target.value || null } })}
//                     placeholder="phone"
//                     disabled={!canEdit}
//                   />
//                   <select
//                     className="border rounded px-2 py-1"
//                     defaultValue={s.preferred_contact_method || ""}
//                     onChange={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { preferred_contact_method: e.target.value || null } })}
//                     disabled={!canEdit}
//                   >
//                     <option value="">Contact</option>
//                     <option value="email">Email</option>
//                     <option value="whatsapp">WhatsApp</option>
//                   </select>
//                   <div className="flex items-center gap-2 justify-end">
//                     <label className="text-xs text-gray-500">Active</label>
//                     <input
//                       type="checkbox"
//                       defaultChecked={s.is_active}
//                       onChange={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { is_active: e.target.checked } })}
//                       disabled={!canEdit}
//                     />
//                     <button
//                       className="px-3 py-1.5 rounded bg-gray-100 text-gray-800 disabled:opacity-50"
//                       onClick={() => {
//                         if (!canEdit) return;
//                         if (confirm(`Delete supplier "${s.name}"?`)) deleteMut.mutate(s.id);
//                       }}
//                       disabled={!canEdit}
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// apps/web/src/pages/inventory/Suppliers.tsx
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "../../lib/api/inventory";
import { useActiveLocation } from "../../lib/activeLocation";
import { useMe } from "../../lib/useMe";

/* lightweight modal */
function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-3"
      onClick={onClose} // click outside => close
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="ml-auto btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-3 border-t bg-gray-50">{footer}</div>}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = !!me?.is_global_admin;

  const { myLocations = [], activeId, setActiveId } = useActiveLocation();
  const [selectedLoc, setSelectedLoc] = React.useState<string | null>(activeId || null);
  React.useEffect(() => { if (activeId && !selectedLoc) setSelectedLoc(activeId); }, [activeId, selectedLoc]);

  const [q, setQ] = React.useState("");
  const { data: rows = [], isFetching } = useQuery({
    enabled: !!selectedLoc,
    queryKey: ["suppliers", selectedLoc, q],
    queryFn: () => suppliersApi.list(selectedLoc!, q),
  });

  const canEditHere = (locId: string) => {
    if (isAdmin) return true;
    const mine = myLocations.find(l => l.id === activeId);
    return !!mine && mine.id === locId && (mine.my_role === "MANAGER");
  };

  /* modal state */
  const [openCreate, setOpenCreate] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", payment_terms: "",
    preferred_contact_method: "" as ""|"email"|"whatsapp",
  });

  const createMut = useMutation({
    mutationFn: () => suppliersApi.create({
      location_id: selectedLoc!, name: form.name, email: form.email || undefined, phone: form.phone || undefined,
      payment_terms: form.payment_terms || undefined,
      preferred_contact_method: (form.preferred_contact_method || undefined) as any,
      is_active: true,
    }),
    onSuccess: () => {
      setForm({ name: "", email: "", phone: "", payment_terms: "", preferred_contact_method: "" });
      qc.invalidateQueries({ queryKey: ["suppliers", selectedLoc] });
      setOpenCreate(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => suppliersApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", selectedLoc] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", selectedLoc] }),
  });

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
      {/* Title + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <div className="flex items-center gap-2">
          <input
            className="input"
            placeholder="Search name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => setOpenCreate(true)}
            disabled={!selectedLoc || !canEditHere(selectedLoc)}
          >
            + Add Supplier
          </button>
        </div>
      </div>

      {/* Location picker */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600">Location</div>
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
        {!isAdmin && <div className="text-xs text-amber-600">Managers can edit only the active location.</div>}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="overflow-auto">
          {isFetching ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No suppliers yet.</div>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-3 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="border-b px-3 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="border-b px-3 py-2 text-left font-medium text-gray-700">Phone</th>
                  <th className="border-b px-3 py-2 text-left font-medium text-gray-700">Contact</th>
                  <th className="border-b px-3 py-2 text-right font-medium text-gray-700 w-48">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s: any, i: number) => {
                  const canEdit = canEditHere(s.location_id);
                  return (
                    <tr
                      key={s.id}
                      className={`${i % 2 ? "bg-gray-50/60" : "bg-white"}`}
                    >
                      <td className="border-t px-3 py-2">
                        <input
                          className="input w-full"
                          defaultValue={s.name}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== s.name && canEdit) updateMut.mutate({ id: s.id, patch: { name: v } });
                            else e.target.value = s.name;
                          }}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="border-t px-3 py-2">
                        <input
                          className="input w-full"
                          defaultValue={s.email || ""}
                          placeholder="email"
                          onBlur={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { email: e.target.value || null } })}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="border-t px-3 py-2">
                        <input
                          className="input w-full"
                          defaultValue={s.phone || ""}
                          placeholder="phone"
                          onBlur={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { phone: e.target.value || null } })}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="border-t px-3 py-2">
                        <select
                          className="input"
                          defaultValue={s.preferred_contact_method || ""}
                          onChange={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { preferred_contact_method: e.target.value || null } })}
                          disabled={!canEdit}
                        >
                          <option value="">—</option>
                          <option value="email">Email</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </td>
                      <td className="border-t px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-3">
                          <label className="text-xs text-gray-500 flex items-center gap-2">
                            <input
                              type="checkbox"
                              defaultChecked={s.is_active}
                              onChange={(e) => canEdit && updateMut.mutate({ id: s.id, patch: { is_active: e.target.checked } })}
                              disabled={!canEdit}
                            />
                            Active
                          </label>
                          <button
                            className="btn"
                            onClick={() => {
                              if (!canEdit) return;
                              if (confirm(`Delete supplier "${s.name}"?`)) deleteMut.mutate(s.id);
                            }}
                            disabled={!canEdit}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        open={openCreate}
        title="Add supplier"
        onClose={() => setOpenCreate(false)}
        footer={
          <div className="flex items-center gap-2 justify-end">
            <button className="btn" onClick={() => setOpenCreate(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => createMut.mutate()}
              disabled={!selectedLoc || !form.name.trim() || createMut.isPending || !canEditHere(selectedLoc!)}
            >
              {createMut.isPending ? "Adding…" : "Add supplier"}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input" placeholder="Name *"
                 value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}/>
          <input className="input" placeholder="Email"
                 value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))}/>
          <input className="input" placeholder="Phone"
                 value={form.phone} onChange={e=>setForm(f=>({...f, phone: e.target.value}))}/>
          <input className="input md:col-span-2" placeholder="Payment terms"
                 value={form.payment_terms} onChange={e=>setForm(f=>({...f, payment_terms: e.target.value}))}/>
          <select className="input"
                  value={form.preferred_contact_method}
                  onChange={e=>setForm(f=>({...f, preferred_contact_method: e.target.value as any}))}>
            <option value="">Preferred contact…</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        {!canEditHere(selectedLoc || "") && (
          <div className="text-xs text-amber-600 mt-3">
            You don’t have permission to modify this location.
          </div>
        )}
      </Modal>
    </div>
  );
}
