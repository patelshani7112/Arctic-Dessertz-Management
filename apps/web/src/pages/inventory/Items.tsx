

// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string; // required on save
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// /* ---------- Small UI helpers (match Locations style) ---------- */
// function Th({
//   children,
//   className = "",
// }: React.PropsWithChildren<{ className?: string }>) {
//   return (
//     <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>
//       {children}
//     </th>
//   );
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return (
//     <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
//   );
// }

// /* ---------- Page ---------- */
// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   // Data
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Mutations
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) =>
//       itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Client-side filtering + sorting (fast, UX-friendly)
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     // Filter by search text
//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     // Filter by category
//     if (categoryFilter) {
//       arr = arr.filter((it) => it.category_id === categoryFilter);
//     }

//     // Filter by supplier (we use default_supplier_id for list view)
//     if (supplierFilter) {
//       arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     }

//     // Active toggle
//     if (activeOnly) {
//       arr = arr.filter((it) => !!it.is_active);
//     }

//     // Sort
//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") {
//         return dir * (a.name || "").localeCompare(b.name || "");
//       }
//       if (sortField === "last_cost") {
//         // Put nulls last always
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       // created_at
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     return arr;
//   }, [items, q, categoryFilter, supplierFilter, activeOnly, sortField, sortDir]);

//   // Actions
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };

//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };

//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };

//   // Reset all filters quickly
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <h1 className="text-xl font-semibold">Items</h1>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//               🔎
//             </span>
//           </div>

//           {/* Category filter */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select
//               className="input min-w-[180px]"
//               value={categoryFilter}
//               onChange={(e) => setCategoryFilter(e.target.value)}
//             >
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Supplier filter (default supplier in list) */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select
//               className="input min-w-[180px]"
//               value={supplierFilter}
//               onChange={(e) => setSupplierFilter(e.target.value)}
//             >
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Active toggle */}
//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input
//               type="checkbox"
//               checked={activeOnly}
//               onChange={(e) => setActiveOnly(e.target.checked)}
//             />
//             Active only
//           </label>

//           {/* Sorter */}
//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select
//                 className="input"
//                 value={sortField}
//                 onChange={(e) => setSortField(e.target.value as SortField)}
//               >
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select
//                 className="input"
//                 value={sortDir}
//                 onChange={(e) => setSortDir(e.target.value as SortDir)}
//               >
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && (
//         <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Table */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>SKU</Th>
//                 <Th>Barcode</Th>
//                 <Th>Unit</Th>
//                 <Th>Order Unit</Th>
//                 <Th>Pack Size</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>Active</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={12} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={12} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => (
//                   <tr
//                     key={it.id}
//                     className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}
//                   >
//                     <Td className="font-medium">{it.name}</Td>
//                     <Td>
//                       {categories.find((c: any) => c.id === it.category_id)?.name || "—"}
//                     </Td>
//                     <Td>{it.sku || "—"}</Td>
//                     <Td>{it.barcode || "—"}</Td>
//                     <Td>{it.unit_display}</Td>
//                     <Td>{it.order_unit}</Td>
//                     <Td>{it.pack_size}</Td>
//                     <Td>{it.default_target_qty ?? "—"}</Td>
//                     <Td>
//                       {suppliers.find((s: any) => s.id === it.default_supplier_id)?.name ||
//                         "—"}
//                     </Td>
//                     <Td>
//                       {it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}
//                     </Td>
//                     <Td>{it.is_active ? "Yes" : "No"}</Td>
//                     <Td className="text-right pr-3">
//                       <div className="inline-flex gap-2 items-center">
//                         <button className="btn" onClick={() => onEditClick(it)}>
//                           Edit
//                         </button>
//                         <button
//                           className="btn"
//                           onClick={() => onDeleteClick(it.id)}
//                           title="Delete item"
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </Td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = {
//               ...payload,
//               location_id,
//               default_supplier_id: defaultSupplierId || null,
//             };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks(created.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ---------- Reconcile item ↔ suppliers on Save ---------- */
// async function saveSupplierLinks(
//   itemId: string,
//   rows: ItemSupplierLink[],
//   location_id: string
// ) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost:
//         r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost:
//           r.last_cost === null || r.last_cost === undefined
//             ? null
//             : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }

// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ---------- Form + SupplierLinksEditor ---------- */
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (
//     body: any,
//     supplierLinks: ItemSupplierLink[],
//     defaultSupplierId: string | null
//   ) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   // Existing links for edit mode
//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     // Block submit if any supplier row is incomplete
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== ""
//           ? Number(form.default_target_qty)
//           : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost:
//         form.last_cost != null && form.last_cost !== ""
//           ? Number(form.last_cost)
//           : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   // Click-outside closes modal
//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit =
//     String(form.name || "").trim().length > 0 &&
//     !links.some((l) => !l.supplier_id);

//   return (
//     <div
//       ref={overlayRef}
//       onMouseDown={onOverlayMouseDown}
//       className="fixed inset-0 bg-black/40 grid place-items-center z-50"
//     >
//       <div
//         className="bg-white rounded-lg shadow-xl w-full max-w-4xl"
//         onMouseDown={(e) => e.stopPropagation()}
//       >
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">
//             {defaultValues?.id ? "Edit Item" : "New Item"}
//           </h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           {/* Basics */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Name *</span>
//               <input
//                 className="input"
//                 required
//                 value={form.name as any}
//                 onChange={(e) => update("name", e.target.value)}
//               />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Category</span>
//               <select
//                 className="input"
//                 value={form.category_id ?? ""}
//                 onChange={(e) => update("category_id", e.target.value || null)}
//               >
//                 <option value="">—</option>
//                 {categories.map((c: any) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Unit Display</span>
//               <input
//                 className="input"
//                 placeholder="ea / kg / L"
//                 value={form.unit_display as any}
//                 onChange={(e) => update("unit_display", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Order Unit</span>
//               <select
//                 className="input"
//                 value={form.order_unit as any}
//                 onChange={(e) => update("order_unit", e.target.value as any)}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Pack Size</span>
//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={form.pack_size as any}
//                 onChange={(e) => update("pack_size", Number(e.target.value))}
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Target Qty</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.default_target_qty as any}
//                 onChange={(e) =>
//                   update(
//                     "default_target_qty",
//                     e.target.value === "" ? null : Number(e.target.value)
//                   )
//                 }
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Last Cost</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.last_cost as any}
//                 onChange={(e) =>
//                   update(
//                     "last_cost",
//                     e.target.value === "" ? null : Number(e.target.value)
//                   )
//                 }
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">SKU</span>
//               <input
//                 className="input"
//                 value={form.sku as any}
//                 onChange={(e) => update("sku", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Barcode</span>
//               <input
//                 className="input"
//                 value={form.barcode as any}
//                 onChange={(e) => update("barcode", e.target.value)}
//               />
//             </label>
//           </div>

//           <label className="text-sm flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={!!form.is_active}
//               onChange={(e) => update("is_active", e.target.checked)}
//             />
//             <span>Active</span>
//           </label>

//           {/* MULTI SUPPLIERS */}
//           <SupplierLinksEditor
//             suppliers={suppliers}
//             value={links}
//             onChange={setLinks}
//             defaultSupplierId={defaultSupplierId}
//             onDefaultChange={(id) => update("default_supplier_id", id)}
//           />

//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="btn btn-primary inline-flex items-center gap-2"
//               disabled={!canSubmit}
//             >
//               {defaultValues?.id ? (
//                 <>
//                   Save
//                 </>
//               ) : createMut.isPending ? (
//                 <>
//                   <Spinner /> Creating
//                 </>
//               ) : (
//                 "Create"
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function SupplierLinksEditor({
//   suppliers,
//   value,
//   onChange,
//   defaultSupplierId,
//   onDefaultChange,
// }: {
//   suppliers: any[];
//   value: ItemSupplierLink[];
//   onChange: (rows: ItemSupplierLink[]) => void;
//   defaultSupplierId: string | null;
//   onDefaultChange: (supplier_id: string | null) => void;
// }) {
//   const addRow = () =>
//     onChange([
//       ...value,
//       // Start empty so user chooses explicitly (prevents “random supplier”)
//       { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null },
//     ]);

//   const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
//     onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const removeRow = (idx: number) => {
//     const row = value[idx];
//     const next = value.filter((_, i) => i !== idx);
//     onChange(next);
//     // If removing the default supplier row, clear or switch
//     if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
//       onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
//     }
//   };

//   return (
//     <div className="rounded border">
//       <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
//         Suppliers
//       </div>
//       <div className="p-3 grid gap-2">
//         {value.length === 0 && (
//           <div className="text-sm text-gray-500">No suppliers linked yet.</div>
//         )}

//         {value.map((row, idx) => {
//           const name =
//             suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
//           const isDefault =
//             row.supplier_id && defaultSupplierId === row.supplier_id;

//           return (
//             <div
//               key={row.id || idx}
//               className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
//             >
//               <div className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="defaultSupplier"
//                   checked={!!isDefault}
//                   onChange={() =>
//                     row.supplier_id && onDefaultChange(row.supplier_id)
//                   }
//                   title="Set as default supplier"
//                   disabled={!row.supplier_id}
//                 />
//                 <select
//                   className="input w-full"
//                   value={row.supplier_id}
//                   onChange={(e) => {
//                     const newSupplier = e.target.value;
//                     updateRow(idx, { supplier_id: newSupplier });
//                     if (isDefault) onDefaultChange(newSupplier || null);
//                   }}
//                 >
//                   <option value="">Choose supplier…</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <select
//                 className="input"
//                 value={row.order_unit || "EACH"}
//                 onChange={(e) =>
//                   updateRow(idx, { order_unit: e.target.value as any })
//                 }
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>

//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={row.pack_size ?? 1}
//                 onChange={(e) =>
//                   updateRow(idx, { pack_size: Number(e.target.value) })
//                 }
//               />

//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 placeholder="Last cost"
//                 value={row.last_cost ?? ""}
//                 onChange={(e) =>
//                   updateRow(idx, {
//                     last_cost:
//                       e.target.value === "" ? null : Number(e.target.value),
//                   })
//                 }
//               />

//               <div className="flex items-center justify-end">
//                 <button className="btn" onClick={() => removeRow(idx)}>
//                   Remove
//                 </button>
//               </div>

//               <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
//                 {isDefault
//                   ? "Default supplier"
//                   : row.supplier_id
//                   ? `Supplier: ${name}`
//                   : "Please choose a supplier"}
//               </div>
//             </div>
//           );
//         })}

//         <div>
//           <button className="btn" onClick={addRow}>
//             + Add supplier
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
//   basketsApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string;
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// /* ---------- Small UI helpers (match Locations style) ---------- */
// function Th({
//   children,
//   className = "",
// }: React.PropsWithChildren<{ className?: string }>) {
//   return (
//     <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>
//       {children}
//     </th>
//   );
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return (
//     <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
//   );
// }

// /* ---------- Sorting ---------- */
// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// /* ============================================================= */
// /*                          PAGE                                 */
// /* ============================================================= */
// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id, activeLocation } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   /* ---------- Data ---------- */
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Current General Cart
//   const { data: basket } = useQuery({
//     enabled: !!location_id,
//     queryKey: ["basket", location_id],
//     queryFn: () => basketsApi.getOrCreate(location_id!),
//   });

//   const {
//     data: lines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   const inCartEachByItem: Record<string, number> = React.useMemo(() => {
//     const map: Record<string, number> = {};
//     (lines || []).forEach((ln: any) => {
//       const id = ln.item?.id || ln.item_id;
//       if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
//     });
//     return map;
//   }, [lines]);

//   /* ---------- Mutations (Item CRUD) ---------- */
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) =>
//       itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Client-side filtering + sorting
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
//     if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     if (activeOnly) arr = arr.filter((it) => !!it.is_active);

//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") {
//         return dir * (a.name || "").localeCompare(b.name || "");
//       }
//       if (sortField === "last_cost") {
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     return arr;
//   }, [items, q, categoryFilter, supplierFilter, activeOnly, sortField, sortDir]);

//   /* ---------- Actions ---------- */
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Items</h1>
//           <div className="text-xs text-gray-500">
//             Location: <b>{activeLocation?.name ?? "—"}</b>
//           </div>
//         </div>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//               🔎
//             </span>
//           </div>

//           {/* Category */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select
//               className="input min-w-[180px]"
//               value={categoryFilter}
//               onChange={(e) => setCategoryFilter(e.target.value)}
//             >
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Supplier */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select
//               className="input min-w-[180px]"
//               value={supplierFilter}
//               onChange={(e) => setSupplierFilter(e.target.value)}
//             >
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Active toggle */}
//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input
//               type="checkbox"
//               checked={activeOnly}
//               onChange={(e) => setActiveOnly(e.target.checked)}
//             />
//             Active only
//           </label>

//           {/* Sorter */}
//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select
//                 className="input"
//                 value={sortField}
//                 onChange={(e) => setSortField(e.target.value as SortField)}
//               >
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select
//                 className="input"
//                 value={sortDir}
//                 onChange={(e) => setSortDir(e.target.value as SortDir)}
//               >
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && (
//         <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Table (simplified columns + Add-to-cart) */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>In Cart</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => {
//                   const catName =
//                     categories.find((c: any) => c.id === it.category_id)?.name || "—";
//                   const supName =
//                     suppliers.find((s: any) => s.id === it.default_supplier_id)?.name || "—";
//                   const inCart = inCartEachByItem[it.id] || 0;

//                   return (
//                     <tr
//                       key={it.id}
//                       className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}
//                     >
//                       <Td className="font-medium">{it.name}</Td>
//                       <Td>{catName}</Td>
//                       <Td>{it.default_target_qty ?? "—"}</Td>
//                       <Td>{supName}</Td>
//                       <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
//                       <Td>
//                         {loadingLines ? (
//                           <span className="text-xs text-gray-500">…</span>
//                         ) : inCart > 0 ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
//                             {inCart} each
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-400">—</span>
//                         )}
//                       </Td>
//                       <Td className="text-right pr-3">
//                         <div className="inline-flex gap-2 items-center">
//                           <AddToCartButton
//                             item={it}
//                             basketId={basket?.id}
//                             defaultQty={it.default_target_qty ?? 0}
//                             onAdded={() => refetchLines()}
//                           />
//                           <button className="btn" onClick={() => onEditClick(it)}>
//                             Edit
//                           </button>
//                           <button
//                             className="btn"
//                             onClick={() => onDeleteClick(it.id)}
//                             title="Delete item"
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </Td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal (Create/Edit) */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = {
//               ...payload,
//               location_id,
//               default_supplier_id: defaultSupplierId || null,
//             };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks(created.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ============================================================= */
// /*                     ADD TO CART BUTTON                        */
// /* ============================================================= */
// function AddToCartButton({
//   item,
//   basketId,
//   defaultQty,
//   onAdded,
// }: {
//   item: Item;
//   basketId?: string;
//   defaultQty: number;
//   onAdded: () => void;
// }) {
//   const qc = useQueryClient();
//   const [open, setOpen] = React.useState(false);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState<number>(0);

//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basketId!, body),
//     onSuccess: async () => {
//       setOpen(false);
//       setEach(0);
//       setMode("DIRECT");
//       await onAdded();
//       qc.invalidateQueries(); // light refresh
//     },
//   });

//   const canAdd =
//     !!basketId && ((mode === "DIRECT" && each > 0) || (mode === "DIFF" && defaultQty >= 0));

//   return (
//     <div className="relative inline-block">
//       <button className="btn" onClick={() => setOpen((o) => !o)} disabled={!basketId}>
//         Add to cart
//       </button>

//       {open && (
//         <div
//           className="absolute right-0 mt-2 w-72 rounded-lg border bg-white shadow-lg p-3 z-20"
//           onMouseDown={(e) => e.stopPropagation()}
//         >
//           <div className="text-sm font-medium mb-2">{item.name}</div>
//           <div className="grid gap-2">
//             <label className="text-sm flex items-center gap-2">
//               <input
//                 type="radio"
//                 name={`mode-${item.id}`}
//                 checked={mode === "DIRECT"}
//                 onChange={() => setMode("DIRECT")}
//               />
//               Direct amount
//             </label>
//             {mode === "DIRECT" && (
//               <input
//                 className="input"
//                 type="number"
//                 min={0}
//                 step={1}
//                 placeholder="Each (required)"
//                 value={each || ""}
//                 onChange={(e) => setEach(e.target.value === "" ? 0 : Number(e.target.value))}
//               />
//             )}

//             <label className="text-sm flex items-center gap-2 mt-1">
//               <input
//                 type="radio"
//                 name={`mode-${item.id}`}
//                 checked={mode === "DIFF"}
//                 onChange={() => setMode("DIFF")}
//               />
//               Differential (to target: {defaultQty ?? 0})
//             </label>

//             <div className="flex justify-end gap-2 mt-2">
//               <button className="btn btn-ghost" onClick={() => setOpen(false)}>
//                 Cancel
//               </button>
//               <button
//                 className="btn btn-primary disabled:opacity-60"
//                 disabled={addLineMut.isPending || !canAdd}
//                 onClick={() =>
//                   addLineMut.mutate({
//                     item_id: item.id,
//                     qty_mode: mode,
//                     qty_each_requested: mode === "DIRECT" ? each : (defaultQty ?? 0),
//                     needs_finalize: true, // non-managers require approval (server can enforce)
//                   })
//                 }
//               >
//                 {addLineMut.isPending ? "Adding…" : "Add"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ============================================================= */
// /*            Reconcile item ↔ suppliers on Save                 */
// /* ============================================================= */
// async function saveSupplierLinks(
//   itemId: string,
//   rows: ItemSupplierLink[],
//   location_id: string
// ) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost:
//         r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost:
//           r.last_cost === null || r.last_cost === undefined
//             ? null
//             : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }

// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ============================================================= */
// /*                FORM + SUPPLIER LINKS EDITOR                   */
// /* ============================================================= */
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (
//     body: any,
//     supplierLinks: ItemSupplierLink[],
//     defaultSupplierId: string | null
//   ) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== ""
//           ? Number(form.default_target_qty)
//           : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost:
//         form.last_cost != null && form.last_cost !== ""
//           ? Number(form.last_cost)
//           : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   // Click-outside closes modal
//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit =
//     String(form.name || "").trim().length > 0 &&
//     !links.some((l) => !l.supplier_id);

//   return (
//     <div
//       ref={overlayRef}
//       onMouseDown={onOverlayMouseDown}
//       className="fixed inset-0 bg-black/40 grid place-items-center z-50"
//     >
//       <div
//         className="bg-white rounded-lg shadow-xl w-full max-w-4xl"
//         onMouseDown={(e) => e.stopPropagation()}
//       >
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">
//             {defaultValues?.id ? "Edit Item" : "New Item"}
//           </h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           {/* Basics */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Name *</span>
//               <input
//                 className="input"
//                 required
//                 value={form.name as any}
//                 onChange={(e) => update("name", e.target.value)}
//               />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Category</span>
//               <select
//                 className="input"
//                 value={form.category_id ?? ""}
//                 onChange={(e) => update("category_id", e.target.value || null)}
//               >
//                 <option value="">—</option>
//                 {categories.map((c: any) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Unit Display</span>
//               <input
//                 className="input"
//                 placeholder="ea / kg / L"
//                 value={form.unit_display as any}
//                 onChange={(e) => update("unit_display", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Order Unit</span>
//               <select
//                 className="input"
//                 value={form.order_unit as any}
//                 onChange={(e) => update("order_unit", e.target.value as any)}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Pack Size</span>
//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={form.pack_size as any}
//                 onChange={(e) => update("pack_size", Number(e.target.value))}
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Target Qty</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.default_target_qty as any}
//                 onChange={(e) =>
//                   update(
//                     "default_target_qty",
//                     e.target.value === "" ? null : Number(e.target.value)
//                   )
//                 }
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Last Cost</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.last_cost as any}
//                 onChange={(e) =>
//                   update(
//                     "last_cost",
//                     e.target.value === "" ? null : Number(e.target.value)
//                   )
//                 }
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">SKU</span>
//               <input
//                 className="input"
//                 value={form.sku as any}
//                 onChange={(e) => update("sku", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Barcode</span>
//               <input
//                 className="input"
//                 value={form.barcode as any}
//                 onChange={(e) => update("barcode", e.target.value)}
//               />
//             </label>
//           </div>

//           <label className="text-sm flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={!!form.is_active}
//               onChange={(e) => update("is_active", e.target.checked)}
//             />
//             <span>Active</span>
//           </label>

//           {/* MULTI SUPPLIERS */}
//           <SupplierLinksEditor
//             suppliers={suppliers}
//             value={links}
//             onChange={setLinks}
//             defaultSupplierId={defaultSupplierId}
//             onDefaultChange={(id) => update("default_supplier_id", id)}
//           />

//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="btn btn-primary inline-flex items-center gap-2"
//               disabled={!canSubmit}
//             >
//               {defaultValues?.id ? (
//                 "Save"
//               ) : (
//                 <>
//                   <Spinner /> Creating
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function SupplierLinksEditor({
//   suppliers,
//   value,
//   onChange,
//   defaultSupplierId,
//   onDefaultChange,
// }: {
//   suppliers: any[];
//   value: ItemSupplierLink[];
//   onChange: (rows: ItemSupplierLink[]) => void;
//   defaultSupplierId: string | null;
//   onDefaultChange: (supplier_id: string | null) => void;
// }) {
//   const addRow = () =>
//     onChange([
//       ...value,
//       { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null },
//     ]);

//   const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
//     onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const removeRow = (idx: number) => {
//     const row = value[idx];
//     const next = value.filter((_, i) => i !== idx);
//     onChange(next);
//     if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
//       onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
//     }
//   };

//   return (
//     <div className="rounded border">
//       <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
//         Suppliers
//       </div>
//       <div className="p-3 grid gap-2">
//         {value.length === 0 && (
//           <div className="text-sm text-gray-500">No suppliers linked yet.</div>
//         )}

//         {value.map((row, idx) => {
//           const name =
//             suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
//           const isDefault = row.supplier_id && defaultSupplierId === row.supplier_id;

//           return (
//             <div
//               key={row.id || idx}
//               className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
//             >
//               <div className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="defaultSupplier"
//                   checked={!!isDefault}
//                   onChange={() => row.supplier_id && onDefaultChange(row.supplier_id)}
//                   title="Set as default supplier"
//                   disabled={!row.supplier_id}
//                 />
//                 <select
//                   className="input w-full"
//                   value={row.supplier_id}
//                   onChange={(e) => {
//                     const newSupplier = e.target.value;
//                     updateRow(idx, { supplier_id: newSupplier });
//                     if (isDefault) onDefaultChange(newSupplier || null);
//                   }}
//                 >
//                   <option value="">Choose supplier…</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <select
//                 className="input"
//                 value={row.order_unit || "EACH"}
//                 onChange={(e) => updateRow(idx, { order_unit: e.target.value as any })}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>

//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={row.pack_size ?? 1}
//                 onChange={(e) => updateRow(idx, { pack_size: Number(e.target.value) })}
//               />

//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 placeholder="Last cost"
//                 value={row.last_cost ?? ""}
//                 onChange={(e) =>
//                   updateRow(idx, {
//                     last_cost: e.target.value === "" ? null : Number(e.target.value),
//                   })
//                 }
//               />

//               <div className="flex items-center justify-end">
//                 <button className="btn" onClick={() => removeRow(idx)}>
//                   Remove
//                 </button>
//               </div>

//               <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
//                 {isDefault
//                   ? "Default supplier"
//                   : row.supplier_id
//                   ? `Supplier: ${name}`
//                   : "Please choose a supplier"}
//               </div>
//             </div>
//           );
//         })}

//         <div>
//           <button className="btn" onClick={addRow}>
//             + Add supplier
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
//   basketsApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string;
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// /* ---------- Small UI helpers ---------- */
// function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
//   return <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>{children}</th>;
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
// }

// /* ---------- Sorting ---------- */
// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// /* ============================================================= */
// /*                            PAGE                                */
// /* ============================================================= */
// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id, activeLocation } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   /* ---------- Data ---------- */
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Current General Cart
//   const { data: basket } = useQuery({
//     enabled: !!location_id,
//     queryKey: ["basket", location_id],
//     queryFn: () => basketsApi.getOrCreate(location_id!),
//   });

//   const {
//     data: lines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   const inCartEachByItem: Record<string, number> = React.useMemo(() => {
//     const map: Record<string, number> = {};
//     (lines || []).forEach((ln: any) => {
//       const id = ln.item?.id || ln.item_id;
//       if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
//     });
//     return map;
//   }, [lines]);

//   /* ---------- Mutations (Item CRUD) ---------- */
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) => itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Client-side filtering + sorting
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
//     if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     if (activeOnly) arr = arr.filter((it) => !!it.is_active);

//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") return dir * (a.name || "").localeCompare(b.name || "");
//       if (sortField === "last_cost") {
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     return arr;
//   }, [items, q, categoryFilter, supplierFilter, activeOnly, sortField, sortDir]);

//   /* ---------- Actions ---------- */
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Items</h1>
//           <div className="text-xs text-gray-500">
//             Location: <b>{activeLocation?.name ?? "—"}</b>
//           </div>
//         </div>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
//           </div>

//           {/* Category */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select className="input min-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Supplier */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select className="input min-w-[180px]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Active toggle */}
//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
//             Active only
//           </label>

//           {/* Sorter */}
//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

//       {/* Table (simplified columns + Add-to-cart) */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>In Cart</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => {
//                   const catName = categories.find((c: any) => c.id === it.category_id)?.name || "—";
//                   const supName = suppliers.find((s: any) => s.id === it.default_supplier_id)?.name || "—";
//                   const inCart = inCartEachByItem[it.id] || 0;

//                   return (
//                     <tr
//                       key={it.id}
//                       className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}
//                     >
//                       <Td className="font-medium">{it.name}</Td>
//                       <Td>{catName}</Td>
//                       <Td>{it.default_target_qty ?? "—"}</Td>
//                       <Td>{supName}</Td>
//                       <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
//                       <Td>
//                         {loadingLines ? (
//                           <span className="text-xs text-gray-500">…</span>
//                         ) : inCart > 0 ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
//                             {inCart} each
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-400">—</span>
//                         )}
//                       </Td>
//                       <Td className="text-right pr-3">
//                         <div className="inline-flex gap-2 items-center">
//                           <AddToCartButton
//                             item={it}
//                             basketId={basket?.id}
//                             defaultQty={it.default_target_qty ?? 0}
//                             onAdded={() => refetchLines()}
//                           />
//                           <button className="btn" onClick={() => onEditClick(it)}>
//                             Edit
//                           </button>
//                           <button className="btn" onClick={() => onDeleteClick(it.id)} title="Delete item">
//                             Delete
//                           </button>
//                         </div>
//                       </Td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal (Create/Edit) */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = { ...payload, location_id, default_supplier_id: defaultSupplierId || null };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks(created.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ============================================================= */
// /*                     ADD TO CART (Responsive)                  */
// /* ============================================================= */
// function AddToCartButton({
//   item,
//   basketId,
//   defaultQty,
//   onAdded,
// }: {
//   item: Item;
//   basketId?: string;
//   defaultQty: number;
//   onAdded: () => void;
// }) {
//   const qc = useQueryClient();
//   const [open, setOpen] = React.useState(false);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState<number>(0);

//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basketId!, body),
//     onSuccess: async () => {
//       setOpen(false);
//       setEach(0);
//       setMode("DIRECT");
//       await onAdded();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basketId] });
//     },
//   });

//   const canAdd = !!basketId && ((mode === "DIRECT" && each > 0) || (mode === "DIFF" && defaultQty >= 0));

//   return (
//     <>
//       <button className="btn" onClick={() => setOpen(true)} disabled={!basketId}>
//         Add to cart
//       </button>

//       {open && (
//         <div className="fixed inset-0 z-50">
//           {/* overlay */}
//           <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//           {/* sheet/dialog */}
//           <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md">
//             <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
//               <div className="flex items-center gap-2">
//                 <div className="font-semibold truncate">{item.name}</div>
//                 <button className="ml-auto btn btn-ghost" onClick={() => setOpen(false)}>
//                   Close
//                 </button>
//               </div>

//               <div className="mt-3 grid gap-2">
//                 <div className="text-sm text-gray-600">Choose how to add:</div>

//                 <label className="text-sm flex items-center gap-2">
//                   <input type="radio" name={`mode-${item.id}`} checked={mode === "DIRECT"} onChange={() => setMode("DIRECT")} />
//                   Direct amount
//                 </label>

//                 {mode === "DIRECT" && (
//                   <input
//                     className="input"
//                     type="number"
//                     min={0}
//                     step={1}
//                     placeholder="Each (required)"
//                     value={each || ""}
//                     onChange={(e) => setEach(e.target.value === "" ? 0 : Number(e.target.value))}
//                   />
//                 )}

//                 <label className="text-sm flex items-center gap-2 mt-1">
//                   <input type="radio" name={`mode-${item.id}`} checked={mode === "DIFF"} onChange={() => setMode("DIFF")} />
//                   Differential (to target: {defaultQty ?? 0})
//                 </label>

//                 <div className="flex justify-end gap-2 mt-3">
//                   <button className="btn btn-ghost" onClick={() => setOpen(false)}>
//                     Cancel
//                   </button>
//                   <button
//                     className="btn btn-primary disabled:opacity-60"
//                     disabled={addLineMut.isPending || !canAdd}
//                     onClick={() =>
//                       addLineMut.mutate({
//                         item_id: item.id,
//                         qty_mode: mode,
//                         qty_each_requested: mode === "DIRECT" ? each : (defaultQty ?? 0),
//                         needs_finalize: true, // non-managers require approval
//                       })
//                     }
//                   >
//                     {addLineMut.isPending ? "Adding…" : "Add"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// /* ============================================================= */
// /*            Reconcile item ↔ suppliers on Save                 */
// /* ============================================================= */
// async function saveSupplierLinks(itemId: string, rows: ItemSupplierLink[], location_id: string) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }

// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ============================================================= */
// /*                FORM + SUPPLIER LINKS EDITOR                   */
// /* ============================================================= */
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (body: any, supplierLinks: ItemSupplierLink[], defaultSupplierId: string | null) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== "" ? Number(form.default_target_qty) : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost: form.last_cost != null && form.last_cost !== "" ? Number(form.last_cost) : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   // Click-outside closes modal
//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit = String(form.name || "").trim().length > 0 && !links.some((l) => !l.supplier_id);

//   return (
//     <div ref={overlayRef} onMouseDown={onOverlayMouseDown} className="fixed inset-0 bg-black/40 grid place-items-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">{defaultValues?.id ? "Edit Item" : "New Item"}</h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           {/* Basics */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Name *</span>
//               <input className="input" required value={form.name as any} onChange={(e) => update("name", e.target.value)} />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Category</span>
//               <select
//                 className="input"
//                 value={form.category_id ?? ""}
//                 onChange={(e) => update("category_id", e.target.value || null)}
//               >
//                 <option value="">—</option>
//                 {categories.map((c: any) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Unit Display</span>
//               <input
//                 className="input"
//                 placeholder="ea / kg / L"
//                 value={form.unit_display as any}
//                 onChange={(e) => update("unit_display", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Order Unit</span>
//               <select className="input" value={form.order_unit as any} onChange={(e) => update("order_unit", e.target.value as any)}>
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Pack Size</span>
//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={form.pack_size as any}
//                 onChange={(e) => update("pack_size", Number(e.target.value))}
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Target Qty</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.default_target_qty as any}
//                 onChange={(e) => update("default_target_qty", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Last Cost</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.last_cost as any}
//                 onChange={(e) => update("last_cost", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">SKU</span>
//               <input className="input" value={form.sku as any} onChange={(e) => update("sku", e.target.value)} />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Barcode</span>
//               <input className="input" value={form.barcode as any} onChange={(e) => update("barcode", e.target.value)} />
//             </label>
//           </div>

//           <label className="text-sm flex items-center gap-2">
//             <input type="checkbox" checked={!!form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
//             <span>Active</span>
//           </label>

//           {/* MULTI SUPPLIERS */}
//           <SupplierLinksEditor
//             suppliers={suppliers}
//             value={links}
//             onChange={setLinks}
//             defaultSupplierId={defaultSupplierId}
//             onDefaultChange={(id) => update("default_supplier_id", id)}
//           />

//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={!canSubmit}>
//               {defaultValues?.id ? (
//                 "Save"
//               ) : (
//                 <>
//                   <Spinner /> Creating
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function SupplierLinksEditor({
//   suppliers,
//   value,
//   onChange,
//   defaultSupplierId,
//   onDefaultChange,
// }: {
//   suppliers: any[];
//   value: ItemSupplierLink[];
//   onChange: (rows: ItemSupplierLink[]) => void;
//   defaultSupplierId: string | null;
//   onDefaultChange: (supplier_id: string | null) => void;
// }) {
//   const addRow = () => onChange([...value, { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null }]);

//   const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
//     onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const removeRow = (idx: number) => {
//     const row = value[idx];
//     const next = value.filter((_, i) => i !== idx);
//     onChange(next);
//     if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
//       onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
//     }
//   };

//   return (
//     <div className="rounded border">
//       <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">Suppliers</div>
//       <div className="p-3 grid gap-2">
//         {value.length === 0 && <div className="text-sm text-gray-500">No suppliers linked yet.</div>}

//         {value.map((row, idx) => {
//           const name = suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
//           const isDefault = row.supplier_id && defaultSupplierId === row.supplier_id;

//           return (
//             <div
//               key={row.id || idx}
//               className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
//             >
//               <div className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="defaultSupplier"
//                   checked={!!isDefault}
//                   onChange={() => row.supplier_id && onDefaultChange(row.supplier_id)}
//                   title="Set as default supplier"
//                   disabled={!row.supplier_id}
//                 />
//                 <select
//                   className="input w-full"
//                   value={row.supplier_id}
//                   onChange={(e) => {
//                     const newSupplier = e.target.value;
//                     updateRow(idx, { supplier_id: newSupplier });
//                     if (isDefault) onDefaultChange(newSupplier || null);
//                   }}
//                 >
//                   <option value="">Choose supplier…</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <select
//                 className="input"
//                 value={row.order_unit || "EACH"}
//                 onChange={(e) => updateRow(idx, { order_unit: e.target.value as any })}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>

//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={row.pack_size ?? 1}
//                 onChange={(e) => updateRow(idx, { pack_size: Number(e.target.value) })}
//               />

//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 placeholder="Last cost"
//                 value={row.last_cost ?? ""}
//                 onChange={(e) => updateRow(idx, { last_cost: e.target.value === "" ? null : Number(e.target.value) })}
//               />

//               <div className="flex items-center justify-end">
//                 <button className="btn" onClick={() => removeRow(idx)}>
//                   Remove
//                 </button>
//               </div>

//               <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
//                 {isDefault ? "Default supplier" : row.supplier_id ? `Supplier: ${name}` : "Please choose a supplier"}
//               </div>
//             </div>
//           );
//         })}

//         <div>
//           <button className="btn" onClick={addRow}>
//             + Add supplier
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
//   basketsApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string;
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// /* ---------- Small UI helpers ---------- */
// function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
//   return <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>{children}</th>;
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
// }

// /* ---------- Sorting ---------- */
// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// /* ============================================================= */
// /*                            PAGE                                */
// /* ============================================================= */
// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id, activeLocation } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   /* ---------- Data ---------- */
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Current General Cart
//   const { data: basket } = useQuery({
//     enabled: !!location_id,
//     queryKey: ["basket", location_id],
//     queryFn: () => basketsApi.getOrCreate(location_id!),
//   });

//   const {
//     data: lines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   const inCartEachByItem: Record<string, number> = React.useMemo(() => {
//     const map: Record<string, number> = {};
//     (lines || []).forEach((ln: any) => {
//       const id = ln.item?.id || ln.item_id;
//       if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
//     });
//     return map;
//   }, [lines]);

//   /* ---------- Mutations (Item CRUD) ---------- */
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) => itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Client-side filtering + sorting
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
//     if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     if (activeOnly) arr = arr.filter((it) => !!it.is_active);

//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") return dir * (a.name || "").localeCompare(b.name || "");
//       if (sortField === "last_cost") {
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     return arr;
//   }, [items, q, categoryFilter, supplierFilter, activeOnly, sortField, sortDir]);

//   /* ---------- Actions ---------- */
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Items</h1>
//           <div className="text-xs text-gray-500">
//             Location: <b>{activeLocation?.name ?? "—"}</b>
//           </div>
//         </div>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
//           </div>

//           {/* Category */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select className="input min-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Supplier */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select className="input min-w-[180px]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Active toggle */}
//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
//             Active only
//           </label>

//           {/* Sorter */}
//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

//       {/* Table (simplified columns + Add-to-cart) */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>In Cart</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => {
//                   const catName = categories.find((c: any) => c.id === it.category_id)?.name || "—";
//                   const supName = suppliers.find((s: any) => s.id === it.default_supplier_id)?.name || "—";
//                   const inCart = inCartEachByItem[it.id] || 0;

//                   return (
//                     <tr
//                       key={it.id}
//                       className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}
//                     >
//                       <Td className="font-medium">{it.name}</Td>
//                       <Td>{catName}</Td>
//                       <Td>{it.default_target_qty ?? "—"}</Td>
//                       <Td>{supName}</Td>
//                       <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
//                       <Td>
//                         {loadingLines ? (
//                           <span className="text-xs text-gray-500">…</span>
//                         ) : inCart > 0 ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
//                             {inCart} each
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-400">—</span>
//                         )}
//                       </Td>
//                       <Td className="text-right pr-3">
//                         <div className="inline-flex gap-2 items-center">
//                           <AddToCartButton
//                             item={it}
//                             basketId={basket?.id}
//                             defaultQty={it.default_target_qty ?? 0}
//                             alreadyInCart={inCart}
//                             onAdded={() => refetchLines()}
//                           />
//                           <button className="btn" onClick={() => onEditClick(it)}>
//                             Edit
//                           </button>
//                           <button className="btn" onClick={() => onDeleteClick(it.id)} title="Delete item">
//                             Delete
//                           </button>
//                         </div>
//                       </Td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal (Create/Edit) */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = { ...payload, location_id, default_supplier_id: defaultSupplierId || null };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks(created.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ============================================================= */
// /*                     ADD TO CART (Responsive)                  */
// /* ============================================================= */
// function AddToCartButton({
//   item,
//   basketId,
//   defaultQty,
//   alreadyInCart,
//   onAdded,
// }: {
//   item: Item;
//   basketId?: string;
//   defaultQty: number;
//   alreadyInCart: number;
//   onAdded: () => void;
// }) {
//   const qc = useQueryClient();
//   const [open, setOpen] = React.useState(false);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState<number>(0);              // DIRECT add
//   const [currentEach, setCurrentEach] = React.useState<number>(0); // DIFF on-hand

//   const targetEach = Number(defaultQty || 0);
//   const remainingToTarget = Math.max(targetEach - alreadyInCart, 0);

//   // DIFF proposed add considers current on-hand AND what’s already in the cart
//   const proposedDiffAdd = Math.max(targetEach - currentEach - alreadyInCart, 0);

//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basketId!, body),
//     onSuccess: async () => {
//       setOpen(false);
//       setEach(0);
//       setCurrentEach(0);
//       setMode("DIRECT");
//       await onAdded();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basketId] });
//     },
//   });

//   function step(setter: (n: number) => void, v: number, delta: number, min = 0) {
//     const next = Math.max((v || 0) + delta, min);
//     setter(next);
//   }

//   function safeAddQuantity(requested: number): number | null {
//     if (targetEach <= 0) return requested; // no target set, let it through

//     const afterAdd = alreadyInCart + requested;
//     if (afterAdd <= targetEach) return requested;

//     const cap = Math.max(targetEach - alreadyInCart, 0);
//     if (cap <= 0) {
//       alert(
//         `Target is ${targetEach} and you already have ${alreadyInCart} in cart. You’ve reached the target for ${item.name}.`
//       );
//       return null;
//     }

//     const ok = confirm(
//       `Target is ${targetEach} and you already have ${alreadyInCart} in cart.\n` +
//       `Do you want to add only the remaining ${cap} to reach the target for “${item.name}”?`
//     );
//     return ok ? cap : null;
//   }

//   const canAdd =
//     !!basketId &&
//     ((mode === "DIRECT" && each > 0) || (mode === "DIFF" && proposedDiffAdd > 0));

//   const onAdd = () => {
//     if (!basketId) return;

//     const raw = mode === "DIRECT" ? each : proposedDiffAdd;
//     const finalEach = safeAddQuantity(raw);
//     if (finalEach == null || finalEach <= 0) return;

//     addLineMut.mutate({
//       item_id: item.id,
//       qty_mode: mode,
//       qty_each_requested: finalEach,
//       needs_finalize: true, // non-managers require approval (server can enforce)
//       ...(mode === "DIFF" ? { qty_each_snapshot_on_hand: currentEach } : {}),
//     });
//   };

//   return (
//     <>
//       <button className="btn" onClick={() => setOpen(true)} disabled={!basketId}>
//         Add to cart
//       </button>

//       {open && (
//         <div className="fixed inset-0 z-50">
//           {/* overlay */}
//           <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//           {/* sheet/dialog */}
//           <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md">
//             <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
//               <div className="flex items-center gap-2">
//                 <div className="font-semibold truncate">{item.name}</div>
//                 <button className="ml-auto btn btn-ghost" onClick={() => setOpen(false)}>
//                   Close
//                 </button>
//               </div>

//               <div className="mt-3 grid gap-3">
//                 {targetEach > 0 && (
//                   <div className="text-xs text-gray-600">
//                     Target: <b>{targetEach}</b> each · In cart now: <b>{alreadyInCart}</b> · Remaining:{" "}
//                     <b>{remainingToTarget}</b>
//                   </div>
//                 )}

//                 <div className="flex items-center gap-3">
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIRECT"}
//                       onChange={() => setMode("DIRECT")}
//                     />
//                     Direct amount
//                   </label>
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIFF"}
//                       onChange={() => setMode("DIFF")}
//                     />
//                     Differential to target
//                   </label>
//                 </div>

//                 {mode === "DIRECT" ? (
//                   <div>
//                     <div className="text-sm mb-1">Each (required)</div>
//                     <div className="flex items-center gap-2">
//                       <button className="btn" onClick={() => step(setEach, each, -1)}>-</button>
//                       <input
//                         className="input w-full"
//                         type="number"
//                         min={0}
//                         step={1}
//                         value={each || 0}
//                         onChange={(e) => setEach(Math.max(Number(e.target.value || 0), 0))}
//                       />
//                       <button className="btn" onClick={() => step(setEach, each, +1)}>+</button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="grid gap-2">
//                     <div className="text-sm">Current on-hand (each)</div>
//                     <div className="flex items-center gap-2">
//                       <button className="btn" onClick={() => step(setCurrentEach, currentEach, -1)}>-</button>
//                       <input
//                         className="input w-full"
//                         type="number"
//                         min={0}
//                         step={1}
//                         value={currentEach}
//                         onChange={(e) => setCurrentEach(Math.max(Number(e.target.value || 0), 0))}
//                       />
//                       <button className="btn" onClick={() => step(setCurrentEach, currentEach, +1)}>+</button>
//                     </div>
//                     <div className="text-xs text-gray-600">
//                       Will add: <b>{proposedDiffAdd}</b> each
//                       {item.order_unit === "CASE" && item.pack_size
//                         ? `  ·  ≈ ${Math.ceil(proposedDiffAdd / Number(item.pack_size || 1))} case(s)`
//                         : ""}
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-end gap-2 mt-2">
//                   <button className="btn btn-ghost" onClick={() => setOpen(false)}>
//                     Cancel
//                   </button>
//                   <button
//                     className="btn btn-primary disabled:opacity-60"
//                     disabled={addLineMut.isPending || !canAdd}
//                     onClick={onAdd}
//                   >
//                     {addLineMut.isPending ? "Adding…" : "Add"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// /* ============================================================= */
// /*            Reconcile item ↔ suppliers on Save                 */
// /* ============================================================= */
// async function saveSupplierLinks(itemId: string, rows: ItemSupplierLink[], location_id: string) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }

// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ============================================================= */
// /*                FORM + SUPPLIER LINKS EDITOR                   */
// /* ============================================================= */
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (body: any, supplierLinks: ItemSupplierLink[], defaultSupplierId: string | null) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== "" ? Number(form.default_target_qty) : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost: form.last_cost != null && form.last_cost !== "" ? Number(form.last_cost) : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   // Click-outside closes modal
//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit = String(form.name || "").trim().length > 0 && !links.some((l) => !l.supplier_id);

//   return (
//     <div ref={overlayRef} onMouseDown={onOverlayMouseDown} className="fixed inset-0 bg-black/40 grid place-items-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">{defaultValues?.id ? "Edit Item" : "New Item"}</h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           {/* Basics */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Name *</span>
//               <input className="input" required value={form.name as any} onChange={(e) => update("name", e.target.value)} />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Category</span>
//               <select
//                 className="input"
//                 value={form.category_id ?? ""}
//                 onChange={(e) => update("category_id", e.target.value || null)}
//               >
//                 <option value="">—</option>
//                 {categories.map((c: any) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Unit Display</span>
//               <input
//                 className="input"
//                 placeholder="ea / kg / L"
//                 value={form.unit_display as any}
//                 onChange={(e) => update("unit_display", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Order Unit</span>
//               <select className="input" value={form.order_unit as any} onChange={(e) => update("order_unit", e.target.value as any)}>
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Pack Size</span>
//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={form.pack_size as any}
//                 onChange={(e) => update("pack_size", Number(e.target.value))}
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Target Qty</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.default_target_qty as any}
//                 onChange={(e) => update("default_target_qty", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Last Cost</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.last_cost as any}
//                 onChange={(e) => update("last_cost", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">SKU</span>
//               <input className="input" value={form.sku as any} onChange={(e) => update("sku", e.target.value)} />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Barcode</span>
//               <input className="input" value={form.barcode as any} onChange={(e) => update("barcode", e.target.value)} />
//             </label>
//           </div>

//           <label className="text-sm flex items-center gap-2">
//             <input type="checkbox" checked={!!form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
//             <span>Active</span>
//           </label>

//           {/* MULTI SUPPLIERS */}
//           <SupplierLinksEditor
//             suppliers={suppliers}
//             value={links}
//             onChange={setLinks}
//             defaultSupplierId={defaultSupplierId}
//             onDefaultChange={(id) => update("default_supplier_id", id)}
//           />

//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={!canSubmit}>
//               {defaultValues?.id ? (
//                 "Save"
//               ) : (
//                 <>
//                   <Spinner /> Creating
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function SupplierLinksEditor({
//   suppliers,
//   value,
//   onChange,
//   defaultSupplierId,
//   onDefaultChange,
// }: {
//   suppliers: any[];
//   value: ItemSupplierLink[];
//   onChange: (rows: ItemSupplierLink[]) => void;
//   defaultSupplierId: string | null;
//   onDefaultChange: (supplier_id: string | null) => void;
// }) {
//   const addRow = () => onChange([...value, { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null }]);

//   const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
//     onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const removeRow = (idx: number) => {
//     const row = value[idx];
//     const next = value.filter((_, i) => i !== idx);
//     onChange(next);
//     if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
//       onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
//     }
//   };

//   return (
//     <div className="rounded border">
//       <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">Suppliers</div>
//       <div className="p-3 grid gap-2">
//         {value.length === 0 && <div className="text-sm text-gray-500">No suppliers linked yet.</div>}

//         {value.map((row, idx) => {
//           const name = suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
//           const isDefault = row.supplier_id && defaultSupplierId === row.supplier_id;

//           return (
//             <div
//               key={row.id || idx}
//               className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
//             >
//               <div className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="defaultSupplier"
//                   checked={!!isDefault}
//                   onChange={() => row.supplier_id && onDefaultChange(row.supplier_id)}
//                   title="Set as default supplier"
//                   disabled={!row.supplier_id}
//                 />
//                 <select
//                   className="input w-full"
//                   value={row.supplier_id}
//                   onChange={(e) => {
//                     const newSupplier = e.target.value;
//                     updateRow(idx, { supplier_id: newSupplier });
//                     if (isDefault) onDefaultChange(newSupplier || null);
//                   }}
//                 >
//                   <option value="">Choose supplier…</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <select
//                 className="input"
//                 value={row.order_unit || "EACH"}
//                 onChange={(e) => updateRow(idx, { order_unit: e.target.value as any })}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>

//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={row.pack_size ?? 1}
//                 onChange={(e) => updateRow(idx, { pack_size: Number(e.target.value) })}
//               />

//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 placeholder="Last cost"
//                 value={row.last_cost ?? ""}
//                 onChange={(e) => updateRow(idx, { last_cost: e.target.value === "" ? null : Number(e.target.value) })}
//               />

//               <div className="flex items-center justify-end">
//                 <button className="btn" onClick={() => removeRow(idx)}>
//                   Remove
//                 </button>
//               </div>

//               <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
//                 {isDefault ? "Default supplier" : row.supplier_id ? `Supplier: ${name}` : "Please choose a supplier"}
//               </div>
//             </div>
//           );
//         })}

//         <div>
//           <button className="btn" onClick={addRow}>
//             + Add supplier
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
//   basketsApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string;
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// type Line = {
//   id: string;
//   basket_id: string;
//   item_id: string;
//   qty_mode: "DIRECT" | "DIFF";
//   qty_each_requested: number;
//   needs_finalize: boolean;
//   item?: Item;
//   supplier?: { id: string; name: string } | null;
// };

// /* ---------- Small UI helpers ---------- */
// function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
//   return <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>{children}</th>;
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
// }

// /* ---------- Sorting ---------- */
// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// /* ============================================================= */
// /*                            PAGE                                */
// /* ============================================================= */
// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id, activeLocation } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   /* ---------- Data ---------- */
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Current General Cart
//   const { data: basket } = useQuery({
//     enabled: !!location_id,
//     queryKey: ["basket", location_id],
//     queryFn: () => basketsApi.getOrCreate(location_id!),
//   });

//   const {
//     data: lines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery<Line[]>({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   // map item_id -> total each already in cart
//   const inCartEachByItem: Record<string, number> = React.useMemo(() => {
//     const map: Record<string, number> = {};
//     (lines || []).forEach((ln) => {
//       const id = ln.item?.id || ln.item_id;
//       if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
//     });
//     return map;
//   }, [lines]);

//   // map item_id -> first line (so we can merge instead of duplicating)
//   const firstLineByItemId = React.useMemo(() => {
//     const m = new Map<string, Line>();
//     for (const ln of lines || []) {
//       const id = ln.item?.id || ln.item_id;
//       if (id && !m.has(id)) m.set(id, ln);
//     }
//     return m;
//   }, [lines]);

//   /* ---------- Mutations (Item CRUD) ---------- */
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) => itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Update a line qty (merge path)
//   const updateLineMut = useMutation({
//     mutationFn: ({ lineId, nextEach }: { lineId: string; nextEach: number }) =>
//       basketsApi.updateLine(lineId, { qty_each_requested: nextEach, qty_mode: "DIRECT" }),
//     onSuccess: async () => {
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//   });

//   const deleteLineMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.deleteLine(lineId),
//     onSuccess: async () => {
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//   });

//   // Client-side filtering + sorting
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
//     if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     if (activeOnly) arr = arr.filter((it) => !!it.is_active);

//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") return dir * (a.name || "").localeCompare(b.name || "");
//       if (sortField === "last_cost") {
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     return arr;
//   }, [items, q, categoryFilter, supplierFilter, activeOnly, sortField, sortDir]);

//   /* ---------- Actions ---------- */
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   // prevent exceed target; returns permitted qty (or null to cancel)
//   function clampToTarget(item: Item, requested: number): number | null {
//     const target = Number(item.default_target_qty || 0);
//     if (target <= 0) return requested;

//     const already = inCartEachByItem[item.id] || 0;
//     const after = already + requested;
//     if (after <= target) return requested;

//     const cap = Math.max(target - already, 0);
//     if (cap <= 0) {
//       alert(`Target is ${target} and you already have ${already} in cart for “${item.name}”.`);
//       return null;
//     }
//     const ok = confirm(
//       `Target is ${target} and you already have ${already} in cart.\n` +
//         `Do you want to add only ${cap} more for “${item.name}”?`
//     );
//     return ok ? cap : null;
//   }

//   // central upsert: if a line exists for item -> update qty; else create a new line
//   async function upsertCartLineForItem({
//     item,
//     qtyEach,
//     mode,
//     onHandEach,
//   }: {
//     item: Item;
//     qtyEach: number;
//     mode: "DIRECT" | "DIFF";
//     onHandEach?: number;
//   }) {
//     if (!basket?.id || qtyEach <= 0) return;

//     const permitted = clampToTarget(item, qtyEach);
//     if (permitted == null || permitted <= 0) return;

//     const existing = firstLineByItemId.get(item.id);
//     if (existing) {
//       const nextEach = Math.max(0, Number(existing.qty_each_requested || 0) + permitted);
//       await updateLineMut.mutateAsync({ lineId: existing.id, nextEach });
//       return;
//     }

//     // no existing line -> create one
//     await basketsApi
//       .addLine(basket.id, {
//         item_id: item.id,
//         qty_mode: mode,
//         qty_each_requested: permitted,
//         needs_finalize: true,
//         ...(mode === "DIFF" ? { qty_each_snapshot_on_hand: onHandEach ?? 0 } : {}),
//       })
//       .then(() => {
//         qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//         refetchLines();
//       });
//   }

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Items</h1>
//           <div className="text-xs text-gray-500">
//             Location: <b>{activeLocation?.name ?? "—"}</b>
//           </div>
//         </div>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           {/* Search */}
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
//           </div>

//           {/* Category */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select className="input min-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Supplier */}
//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select className="input min-w-[180px]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Active toggle */}
//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
//             Active only
//           </label>

//           {/* Sorter */}
//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

//       {/* Table */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>In Cart</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => {
//                   const catName = categories.find((c: any) => c.id === it.category_id)?.name || "—";
//                   const supName = suppliers.find((s: any) => s.id === it.default_supplier_id)?.name || "—";
//                   const inCart = inCartEachByItem[it.id] || 0;
//                   const existingLine = firstLineByItemId.get(it.id);

//                   return (
//                     <tr
//                       key={it.id}
//                       className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}
//                     >
//                       <Td className="font-medium">{it.name}</Td>
//                       <Td>{catName}</Td>
//                       <Td>{it.default_target_qty ?? "—"}</Td>
//                       <Td>{supName}</Td>
//                       <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
//                       <Td>
//                         {loadingLines ? (
//                           <span className="text-xs text-gray-500">…</span>
//                         ) : inCart > 0 ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
//                             {inCart} each
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-400">—</span>
//                         )}
//                       </Td>
//                       <Td className="text-right pr-3">
//                         <div className="inline-flex gap-2 items-center">
//                           <AddToCartButton
//                             item={it}
//                             basketId={basket?.id}
//                             defaultQty={it.default_target_qty ?? 0}
//                             alreadyInCart={inCart}
//                             onAdd={(qtyEach, mode, onHandEach) =>
//                               upsertCartLineForItem({ item: it, qtyEach, mode, onHandEach })
//                             }
//                           />
//                           {existingLine && (
//                             <QtyStepper
//                               line={existingLine}
//                               item={it}
//                               onInc={async (delta) => {
//                                 const permitted = clampToTarget(it, delta);
//                                 if (permitted == null || permitted <= 0) return;
//                                 const next = Math.max(0, existingLine.qty_each_requested + permitted);
//                                 await updateLineMut.mutateAsync({ lineId: existingLine.id, nextEach: next });
//                               }}
//                               onDec={async (delta) => {
//                                 const next = Math.max(0, existingLine.qty_each_requested - delta);
//                                 if (next === 0) {
//                                   await deleteLineMut.mutateAsync(existingLine.id);
//                                 } else {
//                                   await updateLineMut.mutateAsync({ lineId: existingLine.id, nextEach: next });
//                                 }
//                               }}
//                             />
//                           )}
//                           <button className="btn" onClick={() => onEditClick(it)}>
//                             Edit
//                           </button>
//                           <button className="btn" onClick={() => onDeleteClick(it.id)} title="Delete item">
//                             Delete
//                           </button>
//                         </div>
//                       </Td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal (Create/Edit) */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = { ...payload, location_id, default_supplier_id: defaultSupplierId || null };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks((created as any).id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ============================== Add To Cart =============================== */
// function AddToCartButton({
//   item,
//   basketId,
//   defaultQty,
//   alreadyInCart,
//   onAdd,
// }: {
//   item: Item;
//   basketId?: string;
//   defaultQty: number;
//   alreadyInCart: number;
//   onAdd: (qtyEach: number, mode: "DIRECT" | "DIFF", onHandEach?: number) => void | Promise<void>;
// }) {
//   const [open, setOpen] = React.useState(false);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState<number>(0); // DIRECT
//   const [currentEach, setCurrentEach] = React.useState<number>(0); // DIFF

//   const targetEach = Number(defaultQty || 0);
//   const proposedDiffAdd = Math.max(targetEach - currentEach - alreadyInCart, 0);

//   function step(setter: (n: number) => void, v: number, delta: number, min = 0) {
//     setter(Math.max((v || 0) + delta, min));
//   }

//   const canAdd =
//     !!basketId &&
//     ((mode === "DIRECT" && each > 0) || (mode === "DIFF" && proposedDiffAdd > 0));

//   async function handleAdd() {
//     if (!basketId) return;
//     const qty = mode === "DIRECT" ? each : proposedDiffAdd;
//     if (qty <= 0) return;
//     await onAdd(qty, mode, currentEach);
//     setOpen(false);
//     setEach(0);
//     setCurrentEach(0);
//     setMode("DIRECT");
//   }

//   return (
//     <>
//       <button className="btn" onClick={() => setOpen(true)} disabled={!basketId}>
//         Add to cart
//       </button>

//       {open && (
//         <div className="fixed inset-0 z-50">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//           <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md">
//             <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
//               <div className="flex items-center gap-2">
//                 <div className="font-semibold truncate">{item.name}</div>
//                 <button className="ml-auto btn btn-ghost" onClick={() => setOpen(false)}>
//                   Close
//                 </button>
//               </div>

//               <div className="mt-3 grid gap-3">
//                 {targetEach > 0 && (
//                   <div className="text-xs text-gray-600">
//                     Target: <b>{targetEach}</b> • In cart: <b>{alreadyInCart}</b>
//                   </div>
//                 )}

//                 <div className="flex items-center gap-3">
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIRECT"}
//                       onChange={() => setMode("DIRECT")}
//                     />
//                     Direct amount
//                   </label>
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIFF"}
//                       onChange={() => setMode("DIFF")}
//                     />
//                     Differential to target
//                   </label>
//                 </div>

//                 {mode === "DIRECT" ? (
//                   <div>
//                     <div className="text-sm mb-1">Each (required)</div>
//                     <div className="flex items-center gap-2">
//                       <button className="btn" onClick={() => step(setEach, each, -1)}>-</button>
//                       <input
//                         className="input w-full"
//                         type="number"
//                         min={0}
//                         step={1}
//                         value={each || 0}
//                         onChange={(e) => setEach(Math.max(Number(e.target.value || 0), 0))}
//                       />
//                       <button className="btn" onClick={() => step(setEach, each, +1)}>+</button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="grid gap-2">
//                     <div className="text-sm">Current on-hand (each)</div>
//                     <div className="flex items-center gap-2">
//                       <button className="btn" onClick={() => step(setCurrentEach, currentEach, -1)}>-</button>
//                       <input
//                         className="input w-full"
//                         type="number"
//                         min={0}
//                         step={1}
//                         value={currentEach}
//                         onChange={(e) => setCurrentEach(Math.max(Number(e.target.value || 0), 0))}
//                       />
//                       <button className="btn" onClick={() => step(setCurrentEach, currentEach, +1)}>+</button>
//                     </div>
//                     <div className="text-xs text-gray-600">
//                       Will add: <b>{proposedDiffAdd}</b>
//                       {item.order_unit === "CASE" && item.pack_size
//                         ? `  ·  ≈ ${Math.ceil(proposedDiffAdd / Number(item.pack_size || 1))} case(s)`
//                         : ""}
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-end gap-2 mt-2">
//                   <button className="btn btn-ghost" onClick={() => setOpen(false)}>
//                     Cancel
//                   </button>
//                   <button
//                     className="btn btn-primary disabled:opacity-60"
//                     disabled={!canAdd}
//                     onClick={handleAdd}
//                   >
//                     Add
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// /* ================ Small inline qty stepper for existing line ================= */
// function QtyStepper({
//   line,
//   item,
//   onInc,
//   onDec,
// }: {
//   line: Line;
//   item: Item;
//   onInc: (delta: number) => void | Promise<void>;
//   onDec: (delta: number) => void | Promise<void>;
// }) {
//   const [step, setStep] = React.useState<number>(1);
//   return (
//     <div className="inline-flex items-stretch overflow-hidden rounded border">
//       <button className="px-2 py-1 text-sm hover:bg-gray-50" onClick={() => onDec(step)}>-</button>
//       <div className="px-2 py-1 text-sm bg-gray-50 border-l border-r">{line.qty_each_requested}</div>
//       <button className="px-2 py-1 text-sm hover:bg-gray-50" onClick={() => onInc(step)}>+</button>
//       <select
//         className="text-xs px-1 border-l outline-none"
//         value={step}
//         onChange={(e) => setStep(Math.max(1, Number(e.target.value)))}
//         title="Step"
//       >
//         <option value={1}>+/-1</option>
//         <option value={5}>+/-5</option>
//         <option value={10}>+/-10</option>
//       </select>
//     </div>
//   );
// }

// /* ============================================================= */
// /*            Reconcile item ↔ suppliers on Save                 */
// /* ============================================================= */
// async function saveSupplierLinks(itemId: string, rows: ItemSupplierLink[], location_id: string) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }
// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ============================= Item Form ============================== */
// // (unchanged; kept from your version for brevity)
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (body: any, supplierLinks: ItemSupplierLink[], defaultSupplierId: string | null) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== "" ? Number(form.default_target_qty) : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost: form.last_cost != null && form.last_cost !== "" ? Number(form.last_cost) : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit = String(form.name || "").trim().length > 0 && !links.some((l) => !l.supplier_id);

//   return (
//     <div ref={overlayRef} onMouseDown={onOverlayMouseDown} className="fixed inset-0 bg-black/40 grid place-items-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">{defaultValues?.id ? "Edit Item" : "New Item"}</h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           {/* (inputs unchanged; same as your version) */}
//           {/* ... */}
//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={!canSubmit}>
//               {defaultValues?.id ? "Save" : (<><Spinner /> Creating</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
//   basketsApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string;
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
//   return <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>{children}</th>;
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
// }

// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// /* ============================================================= */
// /*                            PAGE                                */
// /* ============================================================= */
// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id, activeLocation } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   /* ---------- Data ---------- */
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Current General Cart (and lines)
//   const { data: basket } = useQuery({
//     enabled: !!location_id,
//     queryKey: ["basket", location_id],
//     queryFn: () => basketsApi.getOrCreate(location_id!),
//   });

//   const {
//     data: lines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   // Map of item_id -> total "each" already in cart
//   const inCartEachByItem: Record<string, number> = React.useMemo(() => {
//     const map: Record<string, number> = {};
//     (lines || []).forEach((ln: any) => {
//       const id = ln.item?.id || ln.item_id;
//       if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
//     });
//     return map;
//   }, [lines]);

//   /* ---------- Mutations (Item CRUD) ---------- */
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) => itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Client-side filtering + sorting
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
//     if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     if (activeOnly) arr = arr.filter((it) => !!it.is_active);

//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") return dir * (a.name || "").localeCompare(b.name || "");
//       if (sortField === "last_cost") {
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     return arr;
//   }, [items, q, categoryFilter, supplierFilter, activeOnly, sortField, sortDir]);

//   /* ---------- Actions ---------- */
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Items</h1>
//           <div className="text-xs text-gray-500">
//             Location: <b>{activeLocation?.name ?? "—"}</b>
//           </div>
//         </div>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
//           </div>

//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select className="input min-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select className="input min-w-[180px]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
//             Active only
//           </label>

//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

//       {/* Table */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>In Cart</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => {
//                   const catName = categories.find((c: any) => c.id === it.category_id)?.name || "—";
//                   const supName = suppliers.find((s: any) => s.id === it.default_supplier_id)?.name || "—";
//                   const inCart = inCartEachByItem[it.id] || 0;

//                   return (
//                     <tr key={it.id} className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}>
//                       <Td className="font-medium">{it.name}</Td>
//                       <Td>{catName}</Td>
//                       <Td>{it.default_target_qty ?? "—"}</Td>
//                       <Td>{supName}</Td>
//                       <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
//                       <Td>
//                         {loadingLines ? (
//                           <span className="text-xs text-gray-500">…</span>
//                         ) : inCart > 0 ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
//                             {inCart} each
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-400">—</span>
//                         )}
//                       </Td>
//                       <Td className="text-right pr-3">
//                         <div className="inline-flex gap-2 items-center">
//                           <AddToCartOnce
//                             item={it}
//                             basketId={basket?.id}
//                             suppliers={suppliers}
//                             alreadyInCart={inCart}
//                             onAdded={() => refetchLines()}
//                           />
//                           <button className="btn" onClick={() => onEditClick(it)}>
//                             Edit
//                           </button>
//                           <button className="btn" onClick={() => onDeleteClick(it.id)} title="Delete item">
//                             Delete
//                           </button>
//                         </div>
//                       </Td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal (Create/Edit) */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = { ...payload, location_id, default_supplier_id: defaultSupplierId || null };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks(created.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ============================================================= */
// /*     ADD ONCE TO CART: disabled if this item is already in     */
// /* ============================================================= */
// function AddToCartOnce({
//   item,
//   basketId,
//   suppliers,
//   alreadyInCart,
//   onAdded,
// }: {
//   item: Item;
//   basketId?: string;
//   suppliers: any[];
//   alreadyInCart: number;
//   onAdded: () => void;
// }) {
//   const qc = useQueryClient();
//   const [open, setOpen] = React.useState(false);

//   // qty mode + inputs
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState<number>(0); // DIRECT
//   const [currentEach, setCurrentEach] = React.useState<number>(0); // DIFF
//   const [supplierId, setSupplierId] = React.useState<string>(item.default_supplier_id || "");

//   const target = Number(item.default_target_qty || 0);
//   const remaining = Math.max(target - alreadyInCart, 0);
//   const proposedDiffEach = Math.max(target - currentEach - alreadyInCart, 0);

//   // hard rule: cannot exceed target on Items page
//   function capToTarget(requested: number) {
//     if (target <= 0) return requested; // no target set => allow
//     const cap = Math.max(target - alreadyInCart, 0);
//     return Math.min(requested, cap);
//   }

//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basketId!, body),
//     onSuccess: async () => {
//       setOpen(false);
//       setEach(0);
//       setCurrentEach(0);
//       setMode("DIRECT");
//       await onAdded();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basketId] });
//     },
//   });

//   const disabled = !basketId || alreadyInCart > 0;
//   const canAdd =
//     !disabled &&
//     ((mode === "DIRECT" && each > 0 && capToTarget(each) > 0) ||
//       (mode === "DIFF" && proposedDiffEach > 0));

//   const onAdd = () => {
//     if (!basketId || alreadyInCart > 0) return;

//     const rawEach = mode === "DIRECT" ? each : proposedDiffEach;
//     const finalEach = capToTarget(rawEach);
//     if (finalEach <= 0) {
//       alert("This would exceed the target quantity.");
//       return;
//     }

//     addLineMut.mutate({
//       item_id: item.id,
//       supplier_id: supplierId || item.default_supplier_id || null,
//       qty_mode: mode,
//       qty_each_requested: finalEach,
//       needs_finalize: true,
//       ...(mode === "DIFF" ? { qty_each_snapshot_on_hand: currentEach } : {}),
//     });
//   };

//   if (alreadyInCart > 0) {
//     return (
//       <div className="flex items-center gap-2">
//         <button className="btn" disabled title="This item is already in the cart. Edit it on the General Cart page.">
//           Added
//         </button>
//         <a className="text-sm underline" href="/app/orders/general">
//           View in cart
//         </a>
//       </div>
//     );
//   }

//   return (
//     <>
//       <button className="btn" onClick={() => setOpen(true)} disabled={!basketId}>
//         Add to cart
//       </button>

//       {open && (
//         <div className="fixed inset-0 z-50">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//           <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md">
//             <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
//               <div className="flex items-center gap-2">
//                 <div className="font-semibold truncate">{item.name}</div>
//                 <button className="ml-auto btn btn-ghost" onClick={() => setOpen(false)}>
//                   Close
//                 </button>
//               </div>

//               <div className="mt-3 grid gap-3">
//                 {target > 0 && (
//                   <div className="text-xs text-gray-600">
//                     Target: <b>{target}</b> · In cart: <b>{alreadyInCart}</b> · Remaining: <b>{remaining}</b>
//                   </div>
//                 )}

//                 {/* Supplier picker (optional) */}
//                 <div>
//                   <div className="text-sm mb-1">Supplier (optional)</div>
//                   <select
//                     className="input w-full"
//                     value={supplierId}
//                     onChange={(e) => setSupplierId(e.target.value)}
//                   >
//                     <option value="">— Use default —</option>
//                     {suppliers.map((s: any) => (
//                       <option key={s.id} value={s.id}>
//                         {s.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIRECT"}
//                       onChange={() => setMode("DIRECT")}
//                     />
//                     Direct
//                   </label>
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIFF"}
//                       onChange={() => setMode("DIFF")}
//                     />
//                     Differential to target
//                   </label>
//                 </div>

//                 {mode === "DIRECT" ? (
//                   <div>
//                     <div className="text-sm mb-1">Each</div>
//                     <input
//                       className="input w-full"
//                       type="number"
//                       min={0}
//                       step={1}
//                       value={each || 0}
//                       onChange={(e) => setEach(Math.max(Number(e.target.value || 0), 0))}
//                     />
//                     {target > 0 && (
//                       <div className="text-[11px] text-gray-500 mt-1">
//                         Max allowed here: {remaining}
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="grid gap-2">
//                     <div className="text-sm">Current on-hand (each)</div>
//                     <input
//                       className="input w-full"
//                       type="number"
//                       min={0}
//                       step={1}
//                       value={currentEach}
//                       onChange={(e) => setCurrentEach(Math.max(Number(e.target.value || 0), 0))}
//                     />
//                     <div className="text-xs text-gray-600">
//                       Will add: <b>{proposedDiffEach}</b>
//                       {item.order_unit === "CASE" && item.pack_size
//                         ? `  ·  ≈ ${Math.ceil(proposedDiffEach / Number(item.pack_size || 1))} case(s)`
//                         : ""}
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-end gap-2 mt-2">
//                   <button className="btn btn-ghost" onClick={() => setOpen(false)}>
//                     Cancel
//                   </button>
//                   <button className="btn btn-primary disabled:opacity-60" disabled={addLineMut.isPending || !canAdd} onClick={onAdd}>
//                     {addLineMut.isPending ? "Adding…" : "Add"}
//                   </button>
//                 </div>

//                 <div className="text-[11px] text-gray-500">
//                   Note: You can only add once from the Items page. To change or remove, go to the General Cart.
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// /* ============================================================= */
// /*            Reconcile item ↔ suppliers on Save                 */
// /* ============================================================= */
// async function saveSupplierLinks(itemId: string, rows: ItemSupplierLink[], location_id: string) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }

// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ============================================================= */
// /*                FORM + SUPPLIER LINKS EDITOR                   */
// /* ============================================================= */
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (body: any, supplierLinks: ItemSupplierLink[], defaultSupplierId: string | null) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== "" ? Number(form.default_target_qty) : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost: form.last_cost != null && form.last_cost !== "" ? Number(form.last_cost) : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit = String(form.name || "").trim().length > 0 && !links.some((l) => !l.supplier_id);

//   return (
//     <div ref={overlayRef} onMouseDown={onOverlayMouseDown} className="fixed inset-0 bg-black/40 grid place-items-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">{defaultValues?.id ? "Edit Item" : "New Item"}</h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Name *</span>
//               <input className="input" required value={form.name as any} onChange={(e) => update("name", e.target.value)} />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Category</span>
//               <select
//                 className="input"
//                 value={form.category_id ?? ""}
//                 onChange={(e) => update("category_id", e.target.value || null)}
//               >
//                 <option value="">—</option>
//                 {categories.map((c: any) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Unit Display</span>
//               <input
//                 className="input"
//                 placeholder="ea / kg / L"
//                 value={form.unit_display as any}
//                 onChange={(e) => update("unit_display", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Order Unit</span>
//               <select className="input" value={form.order_unit as any} onChange={(e) => update("order_unit", e.target.value as any)}>
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Pack Size</span>
//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={form.pack_size as any}
//                 onChange={(e) => update("pack_size", Number(e.target.value))}
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Target Qty</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.default_target_qty as any}
//                 onChange={(e) => update("default_target_qty", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Last Cost</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.last_cost as any}
//                 onChange={(e) => update("last_cost", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">SKU</span>
//               <input className="input" value={form.sku as any} onChange={(e) => update("sku", e.target.value)} />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Barcode</span>
//               <input className="input" value={form.barcode as any} onChange={(e) => update("barcode", e.target.value)} />
//             </label>
//           </div>

//           <label className="text-sm flex items-center gap-2">
//             <input type="checkbox" checked={!!form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
//             <span>Active</span>
//           </label>

//           <SupplierLinksEditor
//             suppliers={suppliers}
//             value={links}
//             onChange={setLinks}
//             defaultSupplierId={defaultSupplierId}
//             onDefaultChange={(id) => update("default_supplier_id", id)}
//           />

//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={!canSubmit}>
//               {defaultValues?.id ? "Save" : (<><Spinner /> Creating</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function SupplierLinksEditor({
//   suppliers,
//   value,
//   onChange,
//   defaultSupplierId,
//   onDefaultChange,
// }: {
//   suppliers: any[];
//   value: ItemSupplierLink[];
//   onChange: (rows: ItemSupplierLink[]) => void;
//   defaultSupplierId: string | null;
//   onDefaultChange: (supplier_id: string | null) => void;
// }) {
//   const addRow = () => onChange([...value, { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null }]);

//   const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
//     onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const removeRow = (idx: number) => {
//     const row = value[idx];
//     const next = value.filter((_, i) => i !== idx);
//     onChange(next);
//     if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
//       onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
//     }
//   };

//   return (
//     <div className="rounded border">
//       <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">Suppliers</div>
//       <div className="p-3 grid gap-2">
//         {value.length === 0 && <div className="text-sm text-gray-500">No suppliers linked yet.</div>}

//         {value.map((row, idx) => {
//           const name = suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
//           const isDefault = row.supplier_id && defaultSupplierId === row.supplier_id;

//           return (
//             <div
//               key={row.id || idx}
//               className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
//             >
//               <div className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="defaultSupplier"
//                   checked={!!isDefault}
//                   onChange={() => row.supplier_id && onDefaultChange(row.supplier_id)}
//                   title="Set as default supplier"
//                   disabled={!row.supplier_id}
//                 />
//                 <select
//                   className="input w-full"
//                   value={row.supplier_id}
//                   onChange={(e) => {
//                     const newSupplier = e.target.value;
//                     updateRow(idx, { supplier_id: newSupplier });
//                     if (isDefault) onDefaultChange(newSupplier || null);
//                   }}
//                 >
//                   <option value="">Choose supplier…</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <select
//                 className="input"
//                 value={row.order_unit || "EACH"}
//                 onChange={(e) => updateRow(idx, { order_unit: e.target.value as any })}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>

//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={row.pack_size ?? 1}
//                 onChange={(e) => updateRow(idx, { pack_size: Number(e.target.value) })}
//               />

//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 placeholder="Last cost"
//                 value={row.last_cost ?? ""}
//                 onChange={(e) => updateRow(idx, { last_cost: e.target.value === "" ? null : Number(e.target.value) })}
//               />

//               <div className="flex items-center justify-end">
//                 <button className="btn" onClick={() => removeRow(idx)}>
//                   Remove
//                 </button>
//               </div>

//               <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
//                 {isDefault ? "Default supplier" : row.supplier_id ? `Supplier: ${name}` : "Please choose a supplier"}
//               </div>
//             </div>
//           );
//         })}

//         <div>
//           <button className="btn" onClick={addRow}>
//             + Add supplier
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   itemsApi,
//   categoriesApi,
//   suppliersApi,
//   itemSuppliersApi,
//   basketsApi,
// } from "../../lib/api/inventory";
// import { useActiveLocation } from "../../lib/activeLocation";

// /* ---------- Types ---------- */
// type Item = {
//   id: string;
//   location_id: string;
//   name: string;
//   category_id: string | null;
//   sku: string | null;
//   barcode: string | null;
//   unit_display: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty: number | null;
//   default_supplier_id: string | null;
//   last_cost: number | null;
//   is_active: boolean;
//   created_at: string;
// };

// type ItemSupplierLink = {
//   id?: string;
//   item_id?: string;
//   supplier_id: string;
//   order_unit?: "EACH" | "CASE";
//   pack_size?: number;
//   last_cost?: number | null;
// };

// function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
//   return <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>{children}</th>;
// }
// function Td({
//   children,
//   className = "",
//   colSpan,
// }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
//   return (
//     <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
//       {children}
//     </td>
//   );
// }
// function Spinner() {
//   return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
// }

// type SortField = "name" | "last_cost" | "created_at";
// type SortDir = "asc" | "desc";

// /* ============================================================= */
// /*                            PAGE                                */
// /* ============================================================= */
// export default function ItemsPage() {
//   const qc = useQueryClient();
//   const { activeId: location_id, activeLocation } = useActiveLocation();

//   const [q, setQ] = React.useState("");
//   const [editing, setEditing] = React.useState<Item | null>(null);
//   const [formOpen, setFormOpen] = React.useState(false);
//   const [error, setError] = React.useState<string | null>(null);

//   // Toolbar filters
//   const [categoryFilter, setCategoryFilter] = React.useState<string>("");
//   const [supplierFilter, setSupplierFilter] = React.useState<string>("");
//   const [activeOnly, setActiveOnly] = React.useState(false);
//   const [sortField, setSortField] = React.useState<SortField>("created_at");
//   const [sortDir, setSortDir] = React.useState<SortDir>("desc");

//   /* ---------- Data ---------- */
//   const { data: items = [], isLoading } = useQuery({
//     queryKey: ["items", location_id, q],
//     queryFn: () => itemsApi.list(location_id!, q),
//     enabled: !!location_id,
//   });

//   const { data: categories = [] } = useQuery({
//     queryKey: ["categories", location_id],
//     queryFn: () => categoriesApi.list(location_id!),
//     enabled: !!location_id,
//   });

//   const { data: suppliers = [] } = useQuery({
//     queryKey: ["suppliers", location_id, ""],
//     queryFn: () => suppliersApi.list(location_id!, ""),
//     enabled: !!location_id,
//   });

//   // Current General Cart (and lines)
//   const { data: basket } = useQuery({
//     enabled: !!location_id,
//     queryKey: ["basket", location_id],
//     queryFn: () => basketsApi.getOrCreate(location_id!),
//   });

//   const {
//     data: lines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   // Map of item_id -> total "each" already in cart
//   const inCartEachByItem: Record<string, number> = React.useMemo(() => {
//     const map: Record<string, number> = {};
//     (lines || []).forEach((ln: any) => {
//       const id = ln.item?.id || ln.item_id;
//       if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
//     });
//     return map;
//   }, [lines]);

//   /* ---------- Mutations (Item CRUD) ---------- */
//   const createMut = useMutation({
//     mutationFn: (body: any) => itemsApi.create(body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to create item"),
//   });

//   const updateMut = useMutation({
//     mutationFn: ({ id, body }: { id: string; body: any }) => itemsApi.update(id, body),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["items", location_id] });
//       setFormOpen(false);
//       setEditing(null);
//     },
//     onError: (e: any) => setError(e?.message || "Failed to update item"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id: string) => itemsApi.remove(id),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
//     onError: (e: any) => setError(e?.message || "Failed to delete item"),
//   });

//   // Client-side filtering + sorting + (NEW) in-cart-first reordering
//   const filteredSorted = React.useMemo(() => {
//     let arr = [...(items as Item[])];

//     const term = q.trim().toLowerCase();
//     if (term) {
//       arr = arr.filter((it) => {
//         const inName = (it.name || "").toLowerCase().includes(term);
//         const inSku = (it.sku || "").toLowerCase().includes(term);
//         const inBarcode = (it.barcode || "").toLowerCase().includes(term);
//         return inName || inSku || inBarcode;
//       });
//     }

//     if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
//     if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
//     if (activeOnly) arr = arr.filter((it) => !!it.is_active);

//     // Primary sort you already had
//     const dir = sortDir === "asc" ? 1 : -1;
//     arr.sort((a, b) => {
//       if (sortField === "name") return dir * (a.name || "").localeCompare(b.name || "");
//       if (sortField === "last_cost") {
//         const av = a.last_cost == null ? Number.POSITIVE_INFINITY : Number(a.last_cost);
//         const bv = b.last_cost == null ? Number.POSITIVE_INFINITY : Number(b.last_cost);
//         return dir * (av - bv);
//       }
//       const at = a.created_at ? Date.parse(a.created_at) : 0;
//       const bt = b.created_at ? Date.parse(b.created_at) : 0;
//       return dir * (at - bt);
//     });

//     // NEW: bring items in cart to the top (then keep the above order inside each bucket)
//     const withWeight = arr.map((it, idx) => ({
//       it,
//       inCart: (inCartEachByItem[it.id] || 0) > 0 ? 0 : 1, // 0 = in cart, 1 = not in cart
//       idx,
//     }));
//     withWeight.sort((a, b) => {
//       if (a.inCart !== b.inCart) return a.inCart - b.inCart;
//       return a.idx - b.idx; // stable-ish (keeps prior sort)
//     });
//     return withWeight.map((w) => w.it);
//   }, [
//     items,
//     q,
//     categoryFilter,
//     supplierFilter,
//     activeOnly,
//     sortField,
//     sortDir,
//     inCartEachByItem, // ← important for reactivity
//   ]);

//   /* ---------- Actions ---------- */
//   const onCreateClick = () => {
//     setEditing(null);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onEditClick = (it: Item) => {
//     setEditing(it);
//     setFormOpen(true);
//     setError(null);
//   };
//   const onDeleteClick = (id: string) => {
//     if (confirm("Delete this item?")) deleteMut.mutate(id);
//   };
//   const clearFilters = () => {
//     setQ("");
//     setCategoryFilter("");
//     setSupplierFilter("");
//     setActiveOnly(false);
//     setSortField("created_at");
//     setSortDir("desc");
//   };

//   return (
//     <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
//       {/* Title + action */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl font-semibold">Items</h1>
//           <div className="text-xs text-gray-500">
//             Location: <b>{activeLocation?.name ?? "—"}</b>
//           </div>
//         </div>
//         <button className="btn btn-primary" onClick={onCreateClick}>
//           + New Item
//         </button>
//       </div>

//       {/* Toolbar */}
//       <div className="card p-4">
//         <div className="flex flex-wrap items-center gap-3">
//           <div className="relative">
//             <input
//               className="input pl-10 w-[260px]"
//               placeholder="Search name, SKU, barcode…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
//           </div>

//           <div>
//             <div className="text-xs text-gray-600 mb-1">Category</div>
//             <select className="input min-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
//               <option value="">All categories</option>
//               {categories.map((c: any) => (
//                 <option key={c.id} value={c.id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <div className="text-xs text-gray-600 mb-1">Supplier</div>
//             <select className="input min-w-[180px]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
//               <option value="">All suppliers</option>
//               {suppliers.map((s: any) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <label className="text-sm flex items-center gap-2 ml-1">
//             <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
//             Active only
//           </label>

//           <div className="ml-auto flex items-end gap-2">
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Sort by</div>
//               <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
//                 <option value="created_at">Created</option>
//                 <option value="name">Name</option>
//                 <option value="last_cost">Price (Last Cost)</option>
//               </select>
//             </div>
//             <div>
//               <div className="text-xs text-gray-600 mb-1">Direction</div>
//               <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
//                 <option value="asc">Ascending ↑</option>
//                 <option value="desc">Descending ↓</option>
//               </select>
//             </div>

//             <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

//       {/* Table */}
//       <div className="card overflow-hidden">
//         <div className="overflow-auto">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <Th>Name</Th>
//                 <Th>Category</Th>
//                 <Th>Target</Th>
//                 <Th>Default Supplier</Th>
//                 <Th>Last Cost</Th>
//                 <Th>In Cart</Th>
//                 <Th className="text-right pr-3">Actions</Th>
//               </tr>
//             </thead>
//             <tbody>
//               {isLoading ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500">
//                     Loading…
//                   </Td>
//                 </tr>
//               ) : filteredSorted.length === 0 ? (
//                 <tr>
//                   <Td colSpan={7} className="text-gray-500 text-center py-10">
//                     No items found.
//                   </Td>
//                 </tr>
//               ) : (
//                 filteredSorted.map((it, i) => {
//                   const catName = categories.find((c: any) => c.id === it.category_id)?.name || "—";
//                   const supName = suppliers.find((s: any) => s.id === it.default_supplier_id)?.name || "—";
//                   const inCart = inCartEachByItem[it.id] || 0;

//                   return (
//                     <tr key={it.id} className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}>
//                       <Td className="font-medium">{it.name}</Td>
//                       <Td>{catName}</Td>
//                       <Td>{it.default_target_qty ?? "—"}</Td>
//                       <Td>{supName}</Td>
//                       <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
//                       <Td>
//                         {loadingLines ? (
//                           <span className="text-xs text-gray-500">…</span>
//                         ) : inCart > 0 ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
//                             {inCart} each
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-400">—</span>
//                         )}
//                       </Td>
//                       <Td className="text-right pr-3">
//                         <div className="inline-flex gap-2 items-center">
//                           <AddToCartOnce
//                             item={it}
//                             basketId={basket?.id}
//                             suppliers={suppliers}
//                             alreadyInCart={inCart}
//                             onAdded={() => refetchLines()}
//                           />
//                           <button className="btn" onClick={() => onEditClick(it)}>
//                             Edit
//                           </button>
//                           <button className="btn" onClick={() => onDeleteClick(it.id)} title="Delete item">
//                             Delete
//                           </button>
//                         </div>
//                       </Td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal (Create/Edit) */}
//       {formOpen && (
//         <ItemForm
//           onClose={() => {
//             setFormOpen(false);
//             setEditing(null);
//           }}
//           onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
//             const body = { ...payload, location_id, default_supplier_id: defaultSupplierId || null };

//             if (editing) {
//               await updateMut.mutateAsync({ id: editing.id, body });
//               await saveSupplierLinks(editing.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             } else {
//               const created = await createMut.mutateAsync(body);
//               await saveSupplierLinks(created.id, supplierLinks, location_id!);
//               await qc.invalidateQueries({ queryKey: ["items", location_id] });
//             }
//           }}
//           categories={categories}
//           suppliers={suppliers}
//           defaultValues={editing || undefined}
//         />
//       )}
//     </div>
//   );
// }

// /* ============================================================= */
// /*     ADD ONCE TO CART: disabled if this item is already in     */
// /* ============================================================= */
// function AddToCartOnce({
//   item,
//   basketId,
//   suppliers,
//   alreadyInCart,
//   onAdded,
// }: {
//   item: Item;
//   basketId?: string;
//   suppliers: any[];
//   alreadyInCart: number;
//   onAdded: () => void;
// }) {
//   const qc = useQueryClient();
//   const [open, setOpen] = React.useState(false);

//   // qty mode + inputs
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState<number>(0); // DIRECT
//   const [currentEach, setCurrentEach] = React.useState<number>(0); // DIFF
//   const [supplierId, setSupplierId] = React.useState<string>(item.default_supplier_id || "");

//   const target = Number(item.default_target_qty || 0);
//   const remaining = Math.max(target - alreadyInCart, 0);
//   const proposedDiffEach = Math.max(target - currentEach - alreadyInCart, 0);

//   // hard rule: cannot exceed target on Items page
//   function capToTarget(requested: number) {
//     if (target <= 0) return requested; // no target set => allow
//     const cap = Math.max(target - alreadyInCart, 0);
//     return Math.min(requested, cap);
//   }

//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basketId!, body),
//     onSuccess: async () => {
//       setOpen(false);
//       setEach(0);
//       setCurrentEach(0);
//       setMode("DIRECT");
//       await onAdded();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basketId] });
//     },
//   });

//   const disabled = !basketId || alreadyInCart > 0;
//   const canAdd =
//     !disabled &&
//     ((mode === "DIRECT" && each > 0 && capToTarget(each) > 0) ||
//       (mode === "DIFF" && proposedDiffEach > 0));

//   const onAdd = () => {
//     if (!basketId || alreadyInCart > 0) return;

//     const rawEach = mode === "DIRECT" ? each : proposedDiffEach;
//     const finalEach = capToTarget(rawEach);
//     if (finalEach <= 0) {
//       alert("This would exceed the target quantity.");
//       return;
//     }

//     addLineMut.mutate({
//       item_id: item.id,
//       supplier_id: supplierId || item.default_supplier_id || null,
//       qty_mode: mode,
//       qty_each_requested: finalEach,
//       needs_finalize: true, // server trigger will override if manager/admin
//       ...(mode === "DIFF" ? { qty_each_snapshot_on_hand: currentEach } : {}),
//     });
//   };

//   if (alreadyInCart > 0) {
//     return (
//       <div className="flex items-center gap-2">
//         <button className="btn" disabled title="This item is already in the cart. Edit it on the General Cart page.">
//           Added
//         </button>
//         <a className="text-sm underline" href="/app/orders/general">
//           View in cart
//         </a>
//       </div>
//     );
//   }

//   return (
//     <>
//       <button className="btn" onClick={() => setOpen(true)} disabled={!basketId}>
//         Add to cart
//       </button>

//       {open && (
//         <div className="fixed inset-0 z-50">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
//           <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md">
//             <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
//               <div className="flex items-center gap-2">
//                 <div className="font-semibold truncate">{item.name}</div>
//                 <button className="ml-auto btn btn-ghost" onClick={() => setOpen(false)}>
//                   Close
//                 </button>
//               </div>

//               <div className="mt-3 grid gap-3">
//                 {target > 0 && (
//                   <div className="text-xs text-gray-600">
//                     Target: <b>{target}</b> · In cart: <b>{alreadyInCart}</b> · Remaining: <b>{remaining}</b>
//                   </div>
//                 )}

//                 {/* Supplier picker (optional) */}
//                 <div>
//                   <div className="text-sm mb-1">Supplier (optional)</div>
//                   <select
//                     className="input w-full"
//                     value={supplierId}
//                     onChange={(e) => setSupplierId(e.target.value)}
//                   >
//                     <option value="">— Use default —</option>
//                     {suppliers.map((s: any) => (
//                       <option key={s.id} value={s.id}>
//                         {s.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIRECT"}
//                       onChange={() => setMode("DIRECT")}
//                     />
//                     Direct
//                   </label>
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name={`mode-${item.id}`}
//                       checked={mode === "DIFF"}
//                       onChange={() => setMode("DIFF")}
//                     />
//                     Differential to target
//                   </label>
//                 </div>

//                 {mode === "DIRECT" ? (
//                   <div>
//                     <div className="text-sm mb-1">Each</div>
//                     <input
//                       className="input w-full"
//                       type="number"
//                       min={0}
//                       step={1}
//                       value={each || 0}
//                       onChange={(e) => setEach(Math.max(Number(e.target.value || 0), 0))}
//                     />
//                     {target > 0 && (
//                       <div className="text-[11px] text-gray-500 mt-1">
//                         Max allowed here: {remaining}
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="grid gap-2">
//                     <div className="text-sm">Current on-hand (each)</div>
//                     <input
//                       className="input w-full"
//                       type="number"
//                       min={0}
//                       step={1}
//                       value={currentEach}
//                       onChange={(e) => setCurrentEach(Math.max(Number(e.target.value || 0), 0))}
//                     />
//                     <div className="text-xs text-gray-600">
//                       Will add: <b>{proposedDiffEach}</b>
//                       {item.order_unit === "CASE" && item.pack_size
//                         ? `  ·  ≈ ${Math.ceil(proposedDiffEach / Number(item.pack_size || 1))} case(s)`
//                         : ""}
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex justify-end gap-2 mt-2">
//                   <button className="btn btn-ghost" onClick={() => setOpen(false)}>
//                     Cancel
//                   </button>
//                   <button className="btn btn-primary disabled:opacity-60" disabled={addLineMut.isPending || !canAdd} onClick={onAdd}>
//                     {addLineMut.isPending ? "Adding…" : "Add"}
//                   </button>
//                 </div>

//                 <div className="text-[11px] text-gray-500">
//                   Note: You can only add once from the Items page. To change or remove, go to the General Cart.
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// /* ============================================================= */
// /*            Reconcile item ↔ suppliers on Save                 */
// /* ============================================================= */
// async function saveSupplierLinks(itemId: string, rows: ItemSupplierLink[], location_id: string) {
//   const existing = await itemSuppliersApi.listByItem(itemId);
//   const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
//   const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

//   const toCreate = rows
//     .filter((r) => !r.id)
//     .map((r) => ({
//       item_id: itemId,
//       supplier_id: r.supplier_id,
//       location_id,
//       order_unit: r.order_unit || "EACH",
//       pack_size: Number(r.pack_size || 1),
//       last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//     }));

//   const toUpdate = rows
//     .filter((r) => r.id && changed(r, existingById.get(r.id!)))
//     .map((r) => ({
//       id: r.id!,
//       patch: {
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: Number(r.pack_size || 1),
//         last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
//       },
//     }));

//   const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

//   for (const c of toCreate) await itemSuppliersApi.create(c);
//   for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
//   for (const d of toDelete) await itemSuppliersApi.remove(d.id);
// }

// function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
//   if (!b) return true;
//   return (
//     a.supplier_id !== b.supplier_id ||
//     (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
//     Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
//     (a.last_cost ?? null) !== (b.last_cost ?? null)
//   );
// }

// /* ============================================================= */
// /*                FORM + SUPPLIER LINKS EDITOR                   */
// /* ============================================================= */
// function ItemForm({
//   onClose,
//   onSubmit,
//   categories,
//   suppliers,
//   defaultValues,
// }: {
//   onClose: () => void;
//   onSubmit: (body: any, supplierLinks: ItemSupplierLink[], defaultSupplierId: string | null) => Promise<void> | void;
//   categories: any[];
//   suppliers: any[];
//   defaultValues?: Partial<Item>;
// }) {
//   const [form, setForm] = React.useState<Partial<Item>>({
//     name: defaultValues?.name ?? "",
//     category_id: defaultValues?.category_id ?? null,
//     sku: defaultValues?.sku ?? "",
//     barcode: defaultValues?.barcode ?? "",
//     unit_display: defaultValues?.unit_display ?? "ea",
//     order_unit: (defaultValues?.order_unit as any) ?? "EACH",
//     pack_size: defaultValues?.pack_size ?? 1,
//     default_target_qty: defaultValues?.default_target_qty ?? null,
//     default_supplier_id: defaultValues?.default_supplier_id ?? null,
//     last_cost: defaultValues?.last_cost ?? null,
//     is_active: defaultValues?.is_active ?? true,
//   });

//   const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
//     enabled: !!defaultValues?.id,
//     queryKey: ["item-suppliers", defaultValues?.id],
//     queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
//   });

//   const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
//   React.useEffect(() => {
//     if (defaultValues?.id && !linksLoading) {
//       const mapped = (existingLinks || []).map((r: any) => ({
//         id: r.id,
//         item_id: r.item_id,
//         supplier_id: r.supplier_id,
//         order_unit: r.order_unit || "EACH",
//         pack_size: r.pack_size || 1,
//         last_cost: r.last_cost ?? null,
//       }));
//       setLinks(mapped);
//     }
//   }, [defaultValues?.id, linksLoading, existingLinks]);

//   const defaultSupplierId = form.default_supplier_id || null;
//   const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (links.some((l) => !l.supplier_id)) return;

//     const body = {
//       name: String(form.name || "").trim(),
//       category_id: form.category_id || null,
//       sku: form.sku ? String(form.sku) : null,
//       barcode: form.barcode ? String(form.barcode) : null,
//       unit_display: form.unit_display || "ea",
//       order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
//       pack_size: Number(form.pack_size || 1),
//       default_target_qty:
//         form.default_target_qty != null && form.default_target_qty !== "" ? Number(form.default_target_qty) : null,
//       default_supplier_id: defaultSupplierId,
//       last_cost: form.last_cost != null && form.last_cost !== "" ? Number(form.last_cost) : null,
//       is_active: !!form.is_active,
//     };
//     await onSubmit(body, links, defaultSupplierId);
//   };

//   const overlayRef = React.useRef<HTMLDivElement>(null);
//   const onOverlayMouseDown = (e: React.MouseEvent) => {
//     if (e.target === overlayRef.current) onClose();
//   };

//   const canSubmit = String(form.name || "").trim().length > 0 && !links.some((l) => !l.supplier_id);

//   return (
//     <div ref={overlayRef} onMouseDown={onOverlayMouseDown} className="fixed inset-0 bg-black/40 grid place-items-center z-50">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
//         <div className="p-4 border-b flex items-center">
//           <h2 className="text-lg font-semibold">{defaultValues?.id ? "Edit Item" : "New Item"}</h2>
//           <button className="ml-auto btn" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Name *</span>
//               <input className="input" required value={form.name as any} onChange={(e) => update("name", e.target.value)} />
//             </label>

//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Category</span>
//               <select
//                 className="input"
//                 value={form.category_id ?? ""}
//                 onChange={(e) => update("category_id", e.target.value || null)}
//               >
//                 <option value="">—</option>
//                 {categories.map((c: any) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Unit Display</span>
//               <input
//                 className="input"
//                 placeholder="ea / kg / L"
//                 value={form.unit_display as any}
//                 onChange={(e) => update("unit_display", e.target.value)}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Order Unit</span>
//               <select className="input" value={form.order_unit as any} onChange={(e) => update("order_unit", e.target.value as any)}>
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Pack Size</span>
//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={form.pack_size as any}
//                 onChange={(e) => update("pack_size", Number(e.target.value))}
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Target Qty</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.default_target_qty as any}
//                 onChange={(e) => update("default_target_qty", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Last Cost</span>
//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 value={form.last_cost as any}
//                 onChange={(e) => update("last_cost", e.target.value === "" ? null : Number(e.target.value))}
//               />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">SKU</span>
//               <input className="input" value={form.sku as any} onChange={(e) => update("sku", e.target.value)} />
//             </label>
//             <label className="flex flex-col gap-1">
//               <span className="text-sm text-gray-600">Barcode</span>
//               <input className="input" value={form.barcode as any} onChange={(e) => update("barcode", e.target.value)} />
//             </label>
//           </div>

//           <label className="text-sm flex items-center gap-2">
//             <input type="checkbox" checked={!!form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
//             <span>Active</span>
//           </label>

//           <SupplierLinksEditor
//             suppliers={suppliers}
//             value={links}
//             onChange={setLinks}
//             defaultSupplierId={defaultSupplierId}
//             onDefaultChange={(id) => update("default_supplier_id", id)}
//           />

//           <div className="flex justify-end gap-2 pt-2">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={!canSubmit}>
//               {defaultValues?.id ? "Save" : (<><Spinner /> Creating</>)}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function SupplierLinksEditor({
//   suppliers,
//   value,
//   onChange,
//   defaultSupplierId,
//   onDefaultChange,
// }: {
//   suppliers: any[];
//   value: ItemSupplierLink[];
//   onChange: (rows: ItemSupplierLink[]) => void;
//   defaultSupplierId: string | null;
//   onDefaultChange: (supplier_id: string | null) => void;
// }) {
//   const addRow = () => onChange([...value, { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null }]);

//   const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
//     onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

//   const removeRow = (idx: number) => {
//     const row = value[idx];
//     const next = value.filter((_, i) => i !== idx);
//     onChange(next);
//     if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
//       onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
//     }
//   };

//   return (
//     <div className="rounded border">
//       <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">Suppliers</div>
//       <div className="p-3 grid gap-2">
//         {value.length === 0 && <div className="text-sm text-gray-500">No suppliers linked yet.</div>}

//         {value.map((row, idx) => {
//           const name = suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
//           const isDefault = row.supplier_id && defaultSupplierId === row.supplier_id;

//           return (
//             <div
//               key={row.id || idx}
//               className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
//             >
//               <div className="flex items-center gap-2">
//                 <input
//                   type="radio"
//                   name="defaultSupplier"
//                   checked={!!isDefault}
//                   onChange={() => row.supplier_id && onDefaultChange(row.supplier_id)}
//                   title="Set as default supplier"
//                   disabled={!row.supplier_id}
//                 />
//                 <select
//                   className="input w-full"
//                   value={row.supplier_id}
//                   onChange={(e) => {
//                     const newSupplier = e.target.value;
//                     updateRow(idx, { supplier_id: newSupplier });
//                     if (isDefault) onDefaultChange(newSupplier || null);
//                   }}
//                 >
//                   <option value="">Choose supplier…</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <select
//                 className="input"
//                 value={row.order_unit || "EACH"}
//                 onChange={(e) => updateRow(idx, { order_unit: e.target.value as any })}
//               >
//                 <option value="EACH">EACH</option>
//                 <option value="CASE">CASE</option>
//               </select>

//               <input
//                 type="number"
//                 min={1}
//                 step="1"
//                 className="input"
//                 value={row.pack_size ?? 1}
//                 onChange={(e) => updateRow(idx, { pack_size: Number(e.target.value) })}
//               />

//               <input
//                 type="number"
//                 min={0}
//                 step="0.01"
//                 className="input"
//                 placeholder="Last cost"
//                 value={row.last_cost ?? ""}
//                 onChange={(e) => updateRow(idx, { last_cost: e.target.value === "" ? null : Number(e.target.value) })}
//               />

//               <div className="flex items-center justify-end">
//                 <button className="btn" onClick={() => removeRow(idx)}>
//                   Remove
//                 </button>
//               </div>

//               <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
//                 {isDefault ? "Default supplier" : row.supplier_id ? `Supplier: ${name}` : "Please choose a supplier"}
//               </div>
//             </div>
//           );
//         })}

//         <div>
//           <button className="btn" onClick={addRow}>
//             + Add supplier
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  itemsApi,
  categoriesApi,
  suppliersApi,
  itemSuppliersApi,
  basketsApi,
} from "../../lib/api/inventory";
import { useActiveLocation } from "../../lib/activeLocation";

/* ---------- Types ---------- */
type Item = {
  id: string;
  location_id: string;
  name: string;
  category_id: string | null;
  sku: string | null;
  barcode: string | null;
  unit_display: string;
  order_unit: "EACH" | "CASE";
  pack_size: number;
  default_target_qty: number | null;
  default_supplier_id: string | null;
  last_cost: number | null;
  is_active: boolean;
  created_at: string;
};

type ItemSupplierLink = {
  id?: string;
  item_id?: string;
  supplier_id: string;
  order_unit?: "EACH" | "CASE";
  pack_size?: number;
  last_cost?: number | null;
};

function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`text-left font-medium text-gray-700 px-3 py-2 ${className}`}>{children}</th>;
}
function Td({
  children,
  className = "",
  colSpan,
}: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td className={`px-3 py-2 border-t ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
function Spinner() {
  return <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />;
}

/** All sortable fields you can click in headers */
type SortField =
  | "name"
  | "category"
  | "target"
  | "supplier"
  | "last_cost"
  | "in_cart"
  | "created_at";
type SortDir = "asc" | "desc";

/* ============================================================= */
/*                            PAGE                                */
/* ============================================================= */
export default function ItemsPage() {
  const qc = useQueryClient();
  const { activeId: location_id, activeLocation } = useActiveLocation();

  const [q, setQ] = React.useState("");
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Toolbar filters
  const [categoryFilter, setCategoryFilter] = React.useState<string>("");
  const [supplierFilter, setSupplierFilter] = React.useState<string>("");
  const [activeOnly, setActiveOnly] = React.useState(false);

  // Sorting
  const [sortField, setSortField] = React.useState<SortField>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  /* ---------- Data ---------- */
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", location_id, q],
    queryFn: () => itemsApi.list(location_id!, q),
    enabled: !!location_id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", location_id],
    queryFn: () => categoriesApi.list(location_id!),
    enabled: !!location_id,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", location_id, ""],
    queryFn: () => suppliersApi.list(location_id!, ""),
    enabled: !!location_id,
  });

  // Current General Cart (and lines)
  const { data: basket } = useQuery({
    enabled: !!location_id,
    queryKey: ["basket", location_id],
    queryFn: () => basketsApi.getOrCreate(location_id!),
  });

  const {
    data: lines = [],
    isFetching: loadingLines,
    refetch: refetchLines,
  } = useQuery({
    enabled: !!basket?.id,
    queryKey: ["basket-lines", basket?.id],
    queryFn: () => basketsApi.lines(basket!.id),
  });

  // Map of item_id -> total "each" already in cart
  const inCartEachByItem: Record<string, number> = React.useMemo(() => {
    const map: Record<string, number> = {};
    (lines || []).forEach((ln: any) => {
      const id = ln.item?.id || ln.item_id;
      if (id) map[id] = (map[id] || 0) + Number(ln.qty_each_requested || 0);
    });
    return map;
  }, [lines]);

  const categoryNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c: any) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const supplierNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    suppliers.forEach((s: any) => m.set(s.id, s.name));
    return m;
  }, [suppliers]);

  /* ---------- Mutations (Item CRUD) ---------- */
  const createMut = useMutation({
    mutationFn: (body: any) => itemsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items", location_id] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (e: any) => setError(e?.message || "Failed to create item"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => itemsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items", location_id] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (e: any) => setError(e?.message || "Failed to update item"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => itemsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", location_id] }),
    onError: (e: any) => setError(e?.message || "Failed to delete item"),
  });

  /* ---------- Sorting helpers ---------- */
  function nullsLastNum(v: number | null | undefined, dir: SortDir) {
    if (v == null) return dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    return Number(v);
  }
  function compareStrings(a: string, b: string, dir: SortDir) {
    const res = (a || "").localeCompare(b || "");
    return dir === "asc" ? res : -res;
  }
  function compareNumbers(a: number | null | undefined, b: number | null | undefined, dir: SortDir) {
    const av = nullsLastNum(a, dir);
    const bv = nullsLastNum(b, dir);
    return dir === "asc" ? av - bv : bv - av;
  }

  // Client-side filtering + sorting + in-cart-first reordering preserved
  const filteredSorted = React.useMemo(() => {
    let arr = [...(items as Item[])];

    const term = q.trim().toLowerCase();
    if (term) {
      arr = arr.filter((it) => {
        const inName = (it.name || "").toLowerCase().includes(term);
        const inSku = (it.sku || "").toLowerCase().includes(term);
        const inBarcode = (it.barcode || "").toLowerCase().includes(term);
        return inName || inSku || inBarcode;
      });
    }

    if (categoryFilter) arr = arr.filter((it) => it.category_id === categoryFilter);
    if (supplierFilter) arr = arr.filter((it) => it.default_supplier_id === supplierFilter);
    if (activeOnly) arr = arr.filter((it) => !!it.is_active);

    // Derived values used by sorting
    const cat = (it: Item) => (it.category_id ? categoryNameById.get(it.category_id) || "" : "");
    const sup = (it: Item) => (it.default_supplier_id ? supplierNameById.get(it.default_supplier_id) || "" : "");
    const tgt = (it: Item) => (it.default_target_qty == null ? null : Number(it.default_target_qty));
    const inc = (it: Item) => Number(inCartEachByItem[it.id] || 0);
    const createdTs = (it: Item) => (it.created_at ? Date.parse(it.created_at) : null);

    // Main sort by current sortField + sortDir
    arr.sort((a, b) => {
      switch (sortField) {
        case "name":
          return compareStrings(a.name || "", b.name || "", sortDir);
        case "category":
          return compareStrings(cat(a), cat(b), sortDir);
        case "supplier":
          return compareStrings(sup(a), sup(b), sortDir);
        case "target":
          return compareNumbers(tgt(a), tgt(b), sortDir);
        case "last_cost":
          return compareNumbers(a.last_cost, b.last_cost, sortDir);
        case "in_cart":
          return compareNumbers(inc(a), inc(b), sortDir);
        case "created_at":
        default:
          return compareNumbers(createdTs(a), createdTs(b), sortDir);
      }
    });

    // Keep "in-cart first" visual preference? If you want strict sorting only, remove this block.
    const withWeight = arr.map((it, idx) => ({
      it,
      inCartWeight: (inCartEachByItem[it.id] || 0) > 0 ? 0 : 1,
      idx,
    }));
    withWeight.sort((a, b) => {
      if (a.inCartWeight !== b.inCartWeight) return a.inCartWeight - b.inCartWeight;
      return a.idx - b.idx; // preserve main sort inside buckets
    });

    return withWeight.map((w) => w.it);
  }, [
    items,
    q,
    categoryFilter,
    supplierFilter,
    activeOnly,
    sortField,
    sortDir,
    categoryNameById,
    supplierNameById,
    inCartEachByItem,
  ]);

  /* ---------- Actions ---------- */
  const onCreateClick = () => {
    setEditing(null);
    setFormOpen(true);
    setError(null);
  };
  const onEditClick = (it: Item) => {
    setEditing(it);
    setFormOpen(true);
    setError(null);
  };
  const onDeleteClick = (id: string) => {
    if (confirm("Delete this item?")) deleteMut.mutate(id);
  };
  const clearFilters = () => {
    setQ("");
    setCategoryFilter("");
    setSupplierFilter("");
    setActiveOnly(false);
    setSortField("created_at");
    setSortDir("desc");
  };

  /* ---------- Clickable sortable header cell ---------- */
  const SortHeader = ({
    label,
    field,
    alignRight = false,
  }: {
    label: string;
    field: SortField;
    alignRight?: boolean;
  }) => {
    const active = sortField === field;
    const arrow = !active ? "↕" : sortDir === "asc" ? "↑" : "↓";
    return (
      <th className={`border-b px-3 py-2 text-sm font-medium text-gray-700 ${alignRight ? "text-right pr-3" : "text-left"}`}>
        <button
          className="inline-flex items-center gap-1 hover:underline"
          onClick={() => {
            if (active) {
              setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            } else {
              setSortField(field);
              setSortDir("asc");
            }
          }}
          title={`Sort by ${label}`}
        >
          <span>{label}</span>
          <span className="text-gray-500">{arrow}</span>
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
      {/* Title + action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Items</h1>
          <div className="text-xs text-gray-500">
            Location: <b>{activeLocation?.name ?? "—"}</b>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onCreateClick}>
          + New Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              className="input pl-10 w-[260px]"
              placeholder="Search name, SKU, barcode…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Category</div>
            <select className="input min-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Supplier</div>
            <select className="input min-w-[180px]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="">All suppliers</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <label className="text-sm flex items-center gap-2 ml-1">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
            Active only
          </label>

          {/* Optional: keep dropdowns to match your previous UX */}
          <div className="ml-auto flex items-end gap-2">
            <div>
              <div className="text-xs text-gray-600 mb-1">Sort by (alt)</div>
              <select className="input" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
                <option value="created_at">Created</option>
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="supplier">Default Supplier</option>
                <option value="target">Target</option>
                <option value="last_cost">Price (Last Cost)</option>
                <option value="in_cart">In Cart</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Direction</div>
              <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
                <option value="asc">Ascending ↑</option>
                <option value="desc">Descending ↓</option>
              </select>
            </div>

            <button className="btn btn-ghost" onClick={clearFilters} title="Clear all filters">
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <SortHeader label="Name" field="name" />
                <SortHeader label="Category" field="category" />
                <SortHeader label="Target" field="target" />
                <SortHeader label="Default Supplier" field="supplier" />
                <SortHeader label="Last Cost" field="last_cost" />
                <SortHeader label="In Cart" field="in_cart" />
                <SortHeader label="Actions" field="created_at" alignRight />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <Td colSpan={7} className="text-gray-500">
                    Loading…
                  </Td>
                </tr>
              ) : filteredSorted.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="text-gray-500 text-center py-10">
                    No items found.
                  </Td>
                </tr>
              ) : (
                filteredSorted.map((it, i) => {
                  const catName = it.category_id ? categoryNameById.get(it.category_id) || "—" : "—";
                  const supName = it.default_supplier_id ? supplierNameById.get(it.default_supplier_id) || "—" : "—";
                  const inCart = inCartEachByItem[it.id] || 0;

                  return (
                    <tr key={it.id} className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}>
                      <Td className="font-medium">{it.name}</Td>
                      <Td>{catName}</Td>
                      <Td>{it.default_target_qty ?? "—"}</Td>
                      <Td>{supName}</Td>
                      <Td>{it.last_cost != null ? Number(it.last_cost).toFixed(2) : "—"}</Td>
                      <Td>
                        {loadingLines ? (
                          <span className="text-xs text-gray-500">…</span>
                        ) : inCart > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-emerald-600 bg-emerald-50 text-emerald-700">
                            {inCart} each
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </Td>
                      <Td className="text-right pr-3">
                        <div className="inline-flex gap-2 items-center">
                          <AddToCartOnce
                            item={it}
                            basketId={basket?.id}
                            suppliers={suppliers}
                            alreadyInCart={inCart}
                            onAdded={() => refetchLines()}
                          />
                          <button className="btn" onClick={() => onEditClick(it)}>
                            Edit
                          </button>
                          <button className="btn" onClick={() => onDeleteClick(it.id)} title="Delete item">
                            Delete
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal (Create/Edit) */}
      {formOpen && (
        <ItemForm
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={async (payload, supplierLinks, defaultSupplierId) => {
            const body = { ...payload, location_id, default_supplier_id: defaultSupplierId || null };

            if (editing) {
              await updateMut.mutateAsync({ id: editing.id, body });
              await saveSupplierLinks(editing.id, supplierLinks, location_id!);
              await qc.invalidateQueries({ queryKey: ["items", location_id] });
            } else {
              const created = await createMut.mutateAsync(body);
              await saveSupplierLinks(created.id, supplierLinks, location_id!);
              await qc.invalidateQueries({ queryKey: ["items", location_id] });
            }
          }}
          categories={categories}
          suppliers={suppliers}
          defaultValues={editing || undefined}
        />
      )}
    </div>
  );
}

/* ============================================================= */
/*     ADD ONCE TO CART: disabled if this item is already in     */
/* ============================================================= */
function AddToCartOnce({
  item,
  basketId,
  suppliers,
  alreadyInCart,
  onAdded,
}: {
  item: Item;
  basketId?: string;
  suppliers: any[];
  alreadyInCart: number;
  onAdded: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  // qty mode + inputs
  const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
  const [each, setEach] = React.useState<number>(0); // DIRECT
  const [currentEach, setCurrentEach] = React.useState<number>(0); // DIFF
  const [supplierId, setSupplierId] = React.useState<string>(item.default_supplier_id || "");

  const target = Number(item.default_target_qty || 0);
  const remaining = Math.max(target - alreadyInCart, 0);
  const proposedDiffEach = Math.max(target - currentEach - alreadyInCart, 0);

  // hard rule: cannot exceed target on Items page
  function capToTarget(requested: number) {
    if (target <= 0) return requested; // no target set => allow
    const cap = Math.max(target - alreadyInCart, 0);
    return Math.min(requested, cap);
  }

  const addLineMut = useMutation({
    mutationFn: (body: any) => basketsApi.addLine(basketId!, body),
    onSuccess: async () => {
      setOpen(false);
      setEach(0);
      setCurrentEach(0);
      setMode("DIRECT");
      await onAdded();
      qc.invalidateQueries({ queryKey: ["basket-lines", basketId] });
    },
  });

  const disabled = !basketId || alreadyInCart > 0;
  const canAdd =
    !disabled &&
    ((mode === "DIRECT" && each > 0 && capToTarget(each) > 0) ||
      (mode === "DIFF" && proposedDiffEach > 0));

  const onAdd = () => {
    if (!basketId || alreadyInCart > 0) return;

    const rawEach = mode === "DIRECT" ? each : proposedDiffEach;
    const finalEach = capToTarget(rawEach);
    if (finalEach <= 0) {
      alert("This would exceed the target quantity.");
      return;
    }

    addLineMut.mutate({
      item_id: item.id,
      supplier_id: supplierId || item.default_supplier_id || null,
      qty_mode: mode,
      qty_each_requested: finalEach,
      needs_finalize: true,
      ...(mode === "DIFF" ? { qty_each_snapshot_on_hand: currentEach } : {}),
    });
  };

  if (alreadyInCart > 0) {
    return (
      <div className="flex items-center gap-2">
        <button className="btn" disabled title="This item is already in the cart. Edit it on the General Cart page.">
          Added
        </button>
        <a className="text-sm underline" href="/app/orders/general">
          View in cart
        </a>
      </div>
    );
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)} disabled={!basketId}>
        Add to cart
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:m-auto sm:h-auto sm:max-w-md">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
              <div className="flex items-center gap-2">
                <div className="font-semibold truncate">{item.name}</div>
                <button className="ml-auto btn btn-ghost" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>

              <div className="mt-3 grid gap-3">
                {target > 0 && (
                  <div className="text-xs text-gray-600">
                    Target: <b>{target}</b> · In cart: <b>{alreadyInCart}</b> · Remaining: <b>{remaining}</b>
                  </div>
                )}

                {/* Supplier picker (optional) */}
                <div>
                  <div className="text-sm mb-1">Supplier (optional)</div>
                  <select
                    className="input w-full"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">— Use default —</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm flex items-center gap-2">
                    <input
                      type="radio"
                      name={`mode-${item.id}`}
                      checked={mode === "DIRECT"}
                      onChange={() => setMode("DIRECT")}
                    />
                    Direct
                  </label>
                  <label className="text-sm flex items-center gap-2">
                    <input
                      type="radio"
                      name={`mode-${item.id}`}
                      checked={mode === "DIFF"}
                      onChange={() => setMode("DIFF")}
                    />
                    Differential to target
                  </label>
                </div>

                {mode === "DIRECT" ? (
                  <div>
                    <div className="text-sm mb-1">Each</div>
                    <input
                      className="input w-full"
                      type="number"
                      min={0}
                      step={1}
                      value={each || 0}
                      onChange={(e) => setEach(Math.max(Number(e.target.value || 0), 0))}
                    />
                    {target > 0 && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        Max allowed here: {remaining}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <div className="text-sm">Current on-hand (each)</div>
                    <input
                      className="input w-full"
                      type="number"
                      min={0}
                      step={1}
                      value={currentEach}
                      onChange={(e) => setCurrentEach(Math.max(Number(e.target.value || 0), 0))}
                    />
                    <div className="text-xs text-gray-600">
                      Will add: <b>{proposedDiffEach}</b>
                      {item.order_unit === "CASE" && item.pack_size
                        ? `  ·  ≈ ${Math.ceil(proposedDiffEach / Number(item.pack_size || 1))} case(s)`
                        : ""}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-2">
                  <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary disabled:opacity-60" disabled={addLineMut.isPending || !canAdd} onClick={onAdd}>
                    {addLineMut.isPending ? "Adding…" : "Add"}
                  </button>
                </div>

                <div className="text-[11px] text-gray-500">
                  Note: You can only add once from the Items page. To change or remove, go to the General Cart.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================= */
/*            Reconcile item ↔ suppliers on Save                 */
/* ============================================================= */
async function saveSupplierLinks(itemId: string, rows: ItemSupplierLink[], location_id: string) {
  const existing = await itemSuppliersApi.listByItem(itemId);
  const existingById = new Map<string, any>(existing.map((r: any) => [r.id, r]));
  const keepIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));

  const toCreate = rows
    .filter((r) => !r.id)
    .map((r) => ({
      item_id: itemId,
      supplier_id: r.supplier_id,
      location_id,
      order_unit: r.order_unit || "EACH",
      pack_size: Number(r.pack_size || 1),
      last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
    }));

  const toUpdate = rows
    .filter((r) => r.id && changed(r, existingById.get(r.id!)))
    .map((r) => ({
      id: r.id!,
      patch: {
        supplier_id: r.supplier_id,
        order_unit: r.order_unit || "EACH",
        pack_size: Number(r.pack_size || 1),
        last_cost: r.last_cost === null || r.last_cost === undefined ? null : Number(r.last_cost),
      },
    }));

  const toDelete = existing.filter((r: any) => !keepIds.has(r.id));

  for (const c of toCreate) await itemSuppliersApi.create(c);
  for (const u of toUpdate) await itemSuppliersApi.update(u.id, u.patch as any);
  for (const d of toDelete) await itemSuppliersApi.remove(d.id);
}

function changed(a: ItemSupplierLink, b: ItemSupplierLink) {
  if (!b) return true;
  return (
    a.supplier_id !== b.supplier_id ||
    (a.order_unit || "EACH") !== (b.order_unit || "EACH") ||
    Number(a.pack_size || 1) !== Number(b.pack_size || 1) ||
    (a.last_cost ?? null) !== (b.last_cost ?? null)
  );
}

/* ============================================================= */
/*                FORM + SUPPLIER LINKS EDITOR                   */
/* ============================================================= */
function ItemForm({
  onClose,
  onSubmit,
  categories,
  suppliers,
  defaultValues,
}: {
  onClose: () => void;
  onSubmit: (body: any, supplierLinks: ItemSupplierLink[], defaultSupplierId: string | null) => Promise<void> | void;
  categories: any[];
  suppliers: any[];
  defaultValues?: Partial<Item>;
}) {
  const [form, setForm] = React.useState<Partial<Item>>({
    name: defaultValues?.name ?? "",
    category_id: defaultValues?.category_id ?? null,
    sku: defaultValues?.sku ?? "",
    barcode: defaultValues?.barcode ?? "",
    unit_display: defaultValues?.unit_display ?? "ea",
    order_unit: (defaultValues?.order_unit as any) ?? "EACH",
    pack_size: defaultValues?.pack_size ?? 1,
    default_target_qty: defaultValues?.default_target_qty ?? null,
    default_supplier_id: defaultValues?.default_supplier_id ?? null,
    last_cost: defaultValues?.last_cost ?? null,
    is_active: defaultValues?.is_active ?? true,
  });

  const { data: existingLinks = [], isFetching: linksLoading } = useQuery({
    enabled: !!defaultValues?.id,
    queryKey: ["item-suppliers", defaultValues?.id],
    queryFn: () => itemSuppliersApi.listByItem(defaultValues!.id!),
  });

  const [links, setLinks] = React.useState<ItemSupplierLink[]>([]);
  React.useEffect(() => {
    if (defaultValues?.id && !linksLoading) {
      const mapped = (existingLinks || []).map((r: any) => ({
        id: r.id,
        item_id: r.item_id,
        supplier_id: r.supplier_id,
        order_unit: r.order_unit || "EACH",
        pack_size: r.pack_size || 1,
        last_cost: r.last_cost ?? null,
      }));
      setLinks(mapped);
    }
  }, [defaultValues?.id, linksLoading, existingLinks]);

  const defaultSupplierId = form.default_supplier_id || null;
  const update = (k: keyof Item, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (links.some((l) => !l.supplier_id)) return;

    const body = {
      name: String(form.name || "").trim(),
      category_id: form.category_id || null,
      sku: form.sku ? String(form.sku) : null,
      barcode: form.barcode ? String(form.barcode) : null,
      unit_display: form.unit_display || "ea",
      order_unit: (form.order_unit as "EACH" | "CASE") || "EACH",
      pack_size: Number(form.pack_size || 1),
      default_target_qty:
        form.default_target_qty != null && form.default_target_qty !== "" ? Number(form.default_target_qty) : null,
      default_supplier_id: defaultSupplierId,
      last_cost: form.last_cost != null && form.last_cost !== "" ? Number(form.last_cost) : null,
      is_active: !!form.is_active,
    };
    await onSubmit(body, links, defaultSupplierId);
  };

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const canSubmit = String(form.name || "").trim().length > 0 && !links.some((l) => !l.supplier_id);

  return (
    <div ref={overlayRef} onMouseDown={onOverlayMouseDown} className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center">
          <h2 className="text-lg font-semibold">{defaultValues?.id ? "Edit Item" : "New Item"}</h2>
          <button className="ml-auto btn" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Name *</span>
              <input className="input" required value={form.name as any} onChange={(e) => update("name", e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Category</span>
              <select
                className="input"
                value={form.category_id ?? ""}
                onChange={(e) => update("category_id", e.target.value || null)}
              >
                <option value="">—</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Unit Display</span>
              <input
                className="input"
                placeholder="ea / kg / L"
                value={form.unit_display as any}
                onChange={(e) => update("unit_display", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Order Unit</span>
              <select className="input" value={form.order_unit as any} onChange={(e) => update("order_unit", e.target.value as any)}>
                <option value="EACH">EACH</option>
                <option value="CASE">CASE</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Pack Size</span>
              <input
                type="number"
                min={1}
                step="1"
                className="input"
                value={form.pack_size as any}
                onChange={(e) => update("pack_size", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Target Qty</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={form.default_target_qty as any}
                onChange={(e) => update("default_target_qty", e.target.value === "" ? null : Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Last Cost</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={form.last_cost as any}
                onChange={(e) => update("last_cost", e.target.value === "" ? null : Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">SKU</span>
              <input className="input" value={form.sku as any} onChange={(e) => update("sku", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Barcode</span>
              <input className="input" value={form.barcode as any} onChange={(e) => update("barcode", e.target.value)} />
            </label>
          </div>

          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
            <span>Active</span>
          </label>

          <SupplierLinksEditor
            suppliers={suppliers}
            value={links}
            onChange={setLinks}
            defaultSupplierId={defaultSupplierId}
            onDefaultChange={(id) => update("default_supplier_id", id)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={!canSubmit}>
              {defaultValues?.id ? "Save" : (<><Spinner /> Creating</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupplierLinksEditor({
  suppliers,
  value,
  onChange,
  defaultSupplierId,
  onDefaultChange,
}: {
  suppliers: any[];
  value: ItemSupplierLink[];
  onChange: (rows: ItemSupplierLink[]) => void;
  defaultSupplierId: string | null;
  onDefaultChange: (supplier_id: string | null) => void;
}) {
  const addRow = () => onChange([...value, { supplier_id: "", order_unit: "EACH", pack_size: 1, last_cost: null }]);

  const updateRow = (idx: number, patch: Partial<ItemSupplierLink>) =>
    onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRow = (idx: number) => {
    const row = value[idx];
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
    if (row?.supplier_id && row.supplier_id === defaultSupplierId) {
      onDefaultChange(next.find((r) => r.supplier_id)?.supplier_id ?? null);
    }
  };

  return (
    <div className="rounded border">
      <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">Suppliers</div>
      <div className="p-3 grid gap-2">
        {value.length === 0 && <div className="text-sm text-gray-500">No suppliers linked yet.</div>}

        {value.map((row, idx) => {
          const name = suppliers.find((s: any) => s.id === row.supplier_id)?.name || "—";
          const isDefault = row.supplier_id && defaultSupplierId === row.supplier_id;

          return (
            <div
              key={row.id || idx}
              className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center bg-white border rounded p-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="defaultSupplier"
                  checked={!!isDefault}
                  onChange={() => row.supplier_id && onDefaultChange(row.supplier_id)}
                  title="Set as default supplier"
                  disabled={!row.supplier_id}
                />
                <select
                  className="input w-full"
                  value={row.supplier_id}
                  onChange={(e) => {
                    const newSupplier = e.target.value;
                    updateRow(idx, { supplier_id: newSupplier });
                    if (isDefault) onDefaultChange(newSupplier || null);
                  }}
                >
                  <option value="">Choose supplier…</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="input"
                value={row.order_unit || "EACH"}
                onChange={(e) => updateRow(idx, { order_unit: e.target.value as any })}
              >
                <option value="EACH">EACH</option>
                <option value="CASE">CASE</option>
              </select>

              <input
                type="number"
                min={1}
                step="1"
                className="input"
                value={row.pack_size ?? 1}
                onChange={(e) => updateRow(idx, { pack_size: Number(e.target.value) })}
              />

              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                placeholder="Last cost"
                value={row.last_cost ?? ""}
                onChange={(e) => updateRow(idx, { last_cost: e.target.value === "" ? null : Number(e.target.value) })}
              />

              <div className="flex items-center justify-end">
                <button className="btn" onClick={() => removeRow(idx)}>
                  Remove
                </button>
              </div>

              <div className="md:col-span-5 -mt-1 text-[11px] text-gray-500">
                {isDefault ? "Default supplier" : row.supplier_id ? `Supplier: ${name}` : "Please choose a supplier"}
              </div>
            </div>
          );
        })}

        <div>
          <button className="btn" onClick={addRow}>
            + Add supplier
          </button>
        </div>
      </div>
    </div>
  );
}
