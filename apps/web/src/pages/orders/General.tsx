// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useActiveLocation } from "../../lib/activeLocation";
// // import { itemsApi, basketsApi } from "../../lib/api/inventory";
// import QtyEditor from "../../components/QtyEditor";

// type Item = {
//   id: string; name: string; sku?: string | null; barcode?: string | null;
//   order_unit: "EACH" | "CASE"; pack_size: number; default_target_qty?: number | null;
// };
// type Basket = { id: string; location_id: string; status: string };
// type Line = {
//   id: string; needs_finalize: boolean; qty_mode: "DIRECT" | "DIFF"; qty_each_requested: number;
//   item: Item; supplier?: { name: string } | null;
// };

// export default function OrdersGeneral() {
//   const qc = useQueryClient();
//   const { activeLocation } = useActiveLocation();
//   const locId = activeLocation?.id;

//   // 1) Basket
//   const { data: basket } = useQuery({
//     enabled: !!locId,
//     queryKey: ["basket", locId],
//     queryFn: () => basketsApi.getOrCreate(locId!),
//   });

//   // 2) Lines
//   const { data: lines = [], refetch: refetchLines, isFetching: loadingLines } = useQuery<Line[]>({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   // 3) Search
//   const [q, setQ] = React.useState("");
//   const [results, setResults] = React.useState<Item[]>([]);
//   async function search() {
//     if (!locId || !q.trim()) { setResults([]); return; }
//     setResults(await itemsApi.list(locId, q));
//   }

//   // 4) Selection + qty editor
//   const [selected, setSelected] = React.useState<Item | null>(null);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState(0);

//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basket!.id, body),
//     onSuccess: async () => {
//       setSelected(null); setEach(0); setMode("DIRECT");
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//   });

//   const finalizeMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.finalizeLine(lineId),
//     onSuccess: () => refetchLines(),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.deleteLine(lineId),
//     onSuccess: () => refetchLines(),
//   });

//   function addSelected() {
//     if (!selected || !basket) return;
//     addLineMut.mutate({
//       item_id: selected.id,
//       qty_mode: mode,
//       qty_each_requested: mode === "DIRECT" ? each : (selected.default_target_qty ?? 0),
//       needs_finalize: true, // staff default
//     });
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div>
//         <h1 className="text-xl font-semibold">🧺 General Cart</h1>
//         <div className="text-sm text-gray-600">
//           Location: <b>{activeLocation?.name ?? "—"}</b>
//         </div>
//       </div>

//       {/* Search & select */}
//       <div className="border rounded-2xl p-4 space-y-3">
//         <div className="flex gap-2">
//           <input
//             className="border rounded px-3 py-2 w-full"
//             placeholder="Search items (name / SKU / barcode)"
//             value={q}
//             onChange={(e)=>setQ(e.target.value)}
//             onKeyDown={(e)=>e.key==="Enter" && search()}
//           />
//           <button className="px-4 py-2 rounded bg-black text-white" onClick={search}>Search</button>
//         </div>
//         {results.length > 0 && (
//           <div className="max-h-56 overflow-auto border rounded">
//             {results.map(it=>(
//               <div key={it.id}
//                    className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex justify-between ${selected?.id===it.id?"bg-gray-50":""}`}
//                    onClick={()=>setSelected(it)}>
//                 <div>
//                   <div className="font-medium">{it.name}</div>
//                   <div className="text-xs text-gray-500">
//                     SKU {it.sku ?? "—"} · {it.order_unit}{it.order_unit==="CASE" ? ` (${it.pack_size}/case)` : ""} · target {it.default_target_qty ?? 0}
//                   </div>
//                 </div>
//                 {selected?.id===it.id && <span className="text-xs text-blue-600">selected</span>}
//               </div>
//             ))}
//           </div>
//         )}

//         {selected && (
//           <div className="border-t pt-3">
//             <QtyEditor
//               item={selected}
//               mode={mode} setMode={setMode}
//               each={each} setEach={setEach}
//             />
//             <div className="mt-3">
//               <button
//                 className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
//                 disabled={addLineMut.isPending || (mode==="DIRECT" && each<=0)}
//                 onClick={addSelected}
//               >
//                 {addLineMut.isPending ? "Adding…" : "Add to cart"}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Lines */}
//       <div className="border rounded-2xl">
//         <div className="px-4 py-3 border-b font-medium">Current lines</div>
//         {loadingLines ? (
//           <div className="p-4 text-sm text-gray-500">Loading…</div>
//         ) : lines.length === 0 ? (
//           <div className="p-4 text-sm text-gray-500">No lines yet.</div>
//         ) : (
//           <div className="divide-y">
//             {lines.map(ln=>(
//               <div key={ln.id} className="p-4 flex items-center justify-between">
//                 <div>
//                   <div className="font-medium">{ln.item?.name ?? "Item"}</div>
//                   <div className="text-xs text-gray-500">
//                     {ln.qty_mode==="DIFF" ? "Differential" : "Direct"} · {ln.qty_each_requested} each
//                     {ln.item?.order_unit==="CASE" && ln.item?.pack_size ? (
//                       <> · ≈ {Math.ceil(ln.qty_each_requested / ln.item.pack_size)} case(s)</>
//                     ) : null}
//                     {ln.supplier?.name ? <> · Supplier: {ln.supplier.name}</> : null}
//                   </div>
//                   {ln.needs_finalize && (
//                     <div className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
//                       Needs manager approval
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex gap-2">
//                   {ln.needs_finalize && (
//                     <button
//                       className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
//                       disabled={finalizeMut.isPending}
//                       onClick={()=>finalizeMut.mutate(ln.id)}
//                     >
//                       {finalizeMut.isPending ? "…" : "Finalize"}
//                     </button>
//                   )}
//                   <button
//                     className="px-3 py-1.5 rounded bg-gray-100 text-gray-800 text-sm disabled:opacity-60"
//                     disabled={deleteMut.isPending}
//                     onClick={()=>deleteMut.mutate(ln.id)}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="text-xs text-gray-500">
//         Next: go to <a className="underline" href="/app/orders/review">Review &amp; Place</a> to move finalized lines into POs.
//       </div>
//     </div>
//   );
// }


// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useActiveLocation } from "../../lib/activeLocation";
// import { itemsApi, basketsApi } from "../../lib/api/inventory";
// import QtyEditor from "../../components/QtyEditor";

// /* Types (kept minimal and aligned with your APIs) */
// type Item = {
//   id: string;
//   name: string;
//   sku?: string | null;
//   barcode?: string | null;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty?: number | null;
// };
// type Line = {
//   id: string;
//   needs_finalize: boolean;
//   qty_mode: "DIRECT" | "DIFF";
//   qty_each_requested: number;
//   item: Item;
//   supplier?: { name: string } | null;
// };
// type Basket = { id: string; location_id: string; status: string };

// export default function OrdersGeneral() {
//   const qc = useQueryClient();
//   const { activeLocation } = useActiveLocation();
//   const locId = activeLocation?.id;

//   // 🛡️ Who can auto-finalize?
//   // If your activeLocation includes my_role, this will work.
//   // Global admin check can also be added if you expose it in a useMe() hook.
//   const myRole = (activeLocation as any)?.my_role as string | undefined;
//   const canApprove = myRole === "MANAGER" || (activeLocation as any)?.is_global_admin;

//   /* 1) Basket for this location */
//   const { data: basket } = useQuery({
//     enabled: !!locId,
//     queryKey: ["basket", locId],
//     queryFn: () => basketsApi.getOrCreate(locId!),
//   });

//   /* 2) Lines for this basket */
//   const {
//     data: lines = [],
//     refetch: refetchLines,
//     isFetching: loadingLines,
//   } = useQuery<Line[]>({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   /* Map of item_id -> qty already in general cart */
//   const inCartMap = React.useMemo(() => {
//     const m = new Map<string, number>();
//     for (const ln of lines) {
//       const id = ln.item?.id;
//       if (!id) continue;
//       m.set(id, (m.get(id) || 0) + Number(ln.qty_each_requested || 0));
//     }
//     return m;
//   }, [lines]);

//   /* 3) Search */
//   const [q, setQ] = React.useState("");
//   const [results, setResults] = React.useState<Item[]>([]);
//   const doSearch = React.useCallback(async () => {
//     if (!locId || !q.trim()) {
//       setResults([]);
//       return;
//     }
//     const list = await itemsApi.list(locId, q);
//     setResults(list);
//   }, [locId, q]);

//   /* 4) Selection + qty editor */
//   const [selected, setSelected] = React.useState<Item | null>(null);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState(0);

//   /* Mutations */
//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basket!.id, body),
//     onSuccess: async () => {
//       setSelected(null);
//       setEach(0);
//       setMode("DIRECT");
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//   });

//   const finalizeMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.finalizeLine(lineId),
//     onSuccess: () => refetchLines(),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.deleteLine(lineId),
//     onSuccess: () => refetchLines(),
//   });

//   /* Add selected item to cart (respect role) */
//   function addSelected() {
//     if (!selected || !basket) return;
//     const needsFinalize = !canApprove; // staff must be reviewed
//     addLineMut.mutate({
//       item_id: selected.id,
//       qty_mode: mode,
//       qty_each_requested:
//         mode === "DIRECT" ? each : Number(selected.default_target_qty ?? 0),
//       needs_finalize: needsFinalize,
//     });
//   }

//   return (
//     <div className="p-6 space-y-6 max-w-5xl mx-auto">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <h1 className="text-xl font-semibold">🧺 General Cart</h1>
//           <div className="text-sm text-gray-600">
//             Location: <b>{activeLocation?.name ?? "—"}</b>{" "}
//             <span className="ml-2 text-xs px-2 py-0.5 rounded-full border">
//               Role: {myRole ?? "STAFF"}
//             </span>
//           </div>
//           {!canApprove && (
//             <div className="mt-1 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 inline-block px-2 py-0.5 rounded">
//               Items you add must be approved by a manager/global admin.
//             </div>
//           )}
//         </div>
//         <div className="text-sm text-gray-500">
//           Basket ID: <span className="font-mono">{basket?.id ?? "—"}</span>
//         </div>
//       </div>

//       {/* Search & select */}
//       <div className="card p-4 space-y-3">
//         <div className="flex gap-2">
//           <div className="relative flex-1">
//             <input
//               className="input pl-10 w-full"
//               placeholder="Search items (name / SKU / barcode)"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && doSearch()}
//             />
//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//               🔎
//             </span>
//           </div>
//           <button className="btn btn-primary" onClick={doSearch}>
//             Search
//           </button>
//         </div>

//         {results.length > 0 && (
//           <div className="max-h-60 overflow-auto rounded border">
//             {results.map((it) => {
//               const isSel = selected?.id === it.id;
//               const alreadyEach = inCartMap.get(it.id) || 0;
//               return (
//                 <div
//                   key={it.id}
//                   className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
//                     isSel ? "bg-gray-50" : ""
//                   }`}
//                   onClick={() => setSelected(it)}
//                 >
//                   <div>
//                     <div className="font-medium flex items-center gap-2">
//                       <span>{it.name}</span>
//                       {alreadyEach > 0 && (
//                         <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
//                           In cart: {alreadyEach} each
//                         </span>
//                       )}
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       SKU {it.sku ?? "—"} · {it.order_unit}
//                       {it.order_unit === "CASE" && it.pack_size
//                         ? ` (${it.pack_size}/case)`
//                         : ""}{" "}
//                       · target {it.default_target_qty ?? 0}
//                     </div>
//                   </div>
//                   {isSel && (
//                     <span className="text-xs text-blue-600">selected</span>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {selected && (
//           <div className="border-t pt-3">
//             <QtyEditor
//               item={selected}
//               mode={mode}
//               setMode={setMode}
//               each={each}
//               setEach={setEach}
//             />
//             <div className="mt-3">
//               <button
//                 className="btn btn-primary"
//                 disabled={addLineMut.isPending || (mode === "DIRECT" && each <= 0)}
//                 onClick={addSelected}
//               >
//                 {addLineMut.isPending ? "Adding…" : "Add to cart"}
//               </button>
//               <button
//                 className="btn btn-ghost ml-2"
//                 onClick={() => setSelected(null)}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Lines */}
//       <div className="card overflow-hidden">
//         <div className="px-4 py-3 border-b font-medium flex items-center gap-2">
//           Current lines
//           <span className="text-xs text-gray-500">
//             ({lines.length} item{lines.length === 1 ? "" : "s"})
//           </span>
//         </div>

//         {loadingLines ? (
//           <div className="p-4 text-sm text-gray-500">Loading…</div>
//         ) : lines.length === 0 ? (
//           <div className="p-4 text-sm text-gray-500">No lines yet.</div>
//         ) : (
//           <div className="divide-y">
//             {lines.map((ln) => (
//               <div
//                 key={ln.id}
//                 className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
//               >
//                 <div>
//                   <div className="font-medium">{ln.item?.name ?? "Item"}</div>
//                   <div className="text-xs text-gray-500">
//                     {ln.qty_mode === "DIFF" ? "Differential" : "Direct"} ·{" "}
//                     {ln.qty_each_requested} each
//                     {ln.item?.order_unit === "CASE" && ln.item?.pack_size
//                       ? ` · ≈ ${Math.ceil(
//                           ln.qty_each_requested / ln.item.pack_size
//                         )} case(s)`
//                       : ""}
//                     {ln.supplier?.name ? ` · Supplier: ${ln.supplier.name}` : ""}
//                   </div>
//                   {ln.needs_finalize && (
//                     <div className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
//                       Needs manager approval
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex gap-2 self-start sm:self-auto">
//                   {ln.needs_finalize && canApprove && (
//                     <button
//                       className="btn btn-primary"
//                       disabled={finalizeMut.isPending}
//                       onClick={() => finalizeMut.mutate(ln.id)}
//                     >
//                       {finalizeMut.isPending ? "…" : "Finalize"}
//                     </button>
//                   )}
//                   <button
//                     className="btn"
//                     disabled={deleteMut.isPending}
//                     onClick={() => deleteMut.mutate(ln.id)}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="text-xs text-gray-500">
//         Next: go to <a className="underline" href="/app/orders/review">Review &amp; Place</a>{" "}
//         to move finalized lines into POs.
//       </div>
//     </div>
//   );
// }

// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useActiveLocation } from "../../lib/activeLocation";
// import { itemsApi, basketsApi, suppliersApi } from "../../lib/api/inventory";

// /* ────────────────────────────── Types (minimal) ───────────────────────────── */
// type Item = {
//   id: string;
//   name: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty?: number | null;
//   default_supplier_id?: string | null;
//   sku?: string | null;
//   barcode?: string | null;
// };

// type Line = {
//   id: string;
//   needs_finalize: boolean;
//   qty_mode: "DIRECT" | "DIFF";
//   qty_each_requested: number;
//   item?: Item;        // some APIs embed item
//   item_id?: string;   // others only return item_id
//   supplier?: { name: string } | null;
// };

// type Basket = { id: string; location_id: string; status: string };

// /* Small helpers */
// function CodeDump({ title, data }: { title: string; data: unknown }) {
//   return (
//     <div className="rounded border p-2">
//       <div className="text-[12px] text-gray-600 mb-1">{title}</div>
//       <pre className="text-[12px] leading-snug overflow-auto max-h-56">
//         {JSON.stringify(data, null, 2)}
//       </pre>
//     </div>
//   );
// }

// /* ────────────────────────────── Page ───────────────────────────── */
// export default function OrdersGeneral() {
//   const qc = useQueryClient();

//   /* 0) Active location (drives everything) */
//   const { activeLocation, activeId: locId } = useActiveLocation() as any;

//   // Debug log: location changes
//   React.useEffect(() => {
//     console.log("[GeneralCart] useActiveLocation ->", { locId, activeLocation });
//   }, [locId, activeLocation]);

//   /* 1) Basket (raw) */
//   const {
//     data: basket,
//     error: basketErr,
//     isFetching: loadingBasket,
//     refetch: refetchBasket,
//   } = useQuery<Basket | undefined>({
//     enabled: !!locId,
//     queryKey: ["basket", locId],
//     queryFn: async () => {
//       console.log("[GeneralCart] basketsApi.getOrCreate start", { locId });
//       try {
//         const b = await basketsApi.getOrCreate(locId!);
//         console.log("[GeneralCart] basketsApi.getOrCreate success", b);
//         return b;
//       } catch (e) {
//         console.error("[GeneralCart] basketsApi.getOrCreate ERROR", e);
//         throw e;
//       }
//     },
//   });

//   /* 2) Lines (raw) */
//   const {
//     data: rawLines = [],
//     error: linesErr,
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery<Line[]>({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id ?? "none"],
//     queryFn: async () => {
//       console.log("[GeneralCart] basketsApi.lines start", { basketId: basket?.id });
//       const r = await basketsApi.lines(basket!.id);
//       console.log("[GeneralCart] basketsApi.lines success", r);
//       return r;
//     },
//   });

//   /* 3) All items (for hydration if a line only returns item_id) */
//   const { data: itemsAll = [] } = useQuery<Item[]>({
//     enabled: !!locId,
//     queryKey: ["items-all", locId],
//     queryFn: async () => {
//       console.log("[GeneralCart] itemsApi.list(all) start", { locId });
//       const r = await itemsApi.list(locId!, "");
//       console.log("[GeneralCart] itemsApi.list(all) success length:", r?.length);
//       return r;
//     },
//   });
//   const itemsById = React.useMemo(
//     () => Object.fromEntries(itemsAll.map((i) => [i.id, i])),
//     [itemsAll]
//   );

//   /* Normalize lines into a predictable shape with ln.item always present (when possible) */
//   const lines: Line[] = React.useMemo(() => {
//     const normalized = (rawLines || []).map((ln: any) => ({
//       ...ln,
//       item: ln.item || (ln.item_id ? itemsById[ln.item_id] : undefined),
//     }));
//     console.log("[GeneralCart] normalized lines", normalized);
//     return normalized;
//   }, [rawLines, itemsById]);

//   /* For “Already in cart” pills on search results */
//   const inCartMap = React.useMemo(() => {
//     const m = new Map<string, number>();
//     for (const ln of lines) {
//       const id = ln.item?.id || ln.item_id;
//       if (!id) continue;
//       m.set(id, (m.get(id) || 0) + Number(ln.qty_each_requested || 0));
//     }
//     return m;
//   }, [lines]);

//   /* 4) Search */
//   const [q, setQ] = React.useState("");
//   const [results, setResults] = React.useState<Item[]>([]);
//   const doSearch = React.useCallback(async () => {
//     if (!locId || !q.trim()) {
//       setResults([]);
//       return;
//     }
//     console.log("[GeneralCart] itemsApi.list(search) start", { locId, q });
//     const list = await itemsApi.list(locId, q);
//     console.log("[GeneralCart] itemsApi.list(search) success length:", list?.length);
//     setResults(list);
//   }, [locId, q]);

//   /* 5) Suppliers (optional) */
//   const { data: suppliers = [] } = useQuery({
//     enabled: !!locId,
//     queryKey: ["suppliers", locId],
//     queryFn: async () => {
//       console.log("[GeneralCart] suppliersApi.list start", { locId });
//       const r = await suppliersApi.list(locId!, "");
//       console.log("[GeneralCart] suppliersApi.list success length:", r?.length);
//       return r;
//     },
//   });

//   /* 6) Selection + qty editor state */
//   const [selected, setSelected] = React.useState<Item | null>(null);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState(0);                // DIRECT each
//   const [currentEach, setCurrentEach] = React.useState<number | "">(""); // DIFF current on-hand
//   const [supplierId, setSupplierId] = React.useState<string | "">("");

//   // prefill default supplier when switching selected item
//   React.useEffect(() => {
//     setSupplierId(selected?.default_supplier_id || "");
//   }, [selected?.id]);

//   const targetEach = Number(selected?.default_target_qty ?? 0);
//   const cur = currentEach === "" ? 0 : Number(currentEach);
//   const diffEach = Math.max(targetEach - cur, 0);
//   const resultEach = mode === "DIRECT" ? each : diffEach;
//   const resultCases =
//     selected?.order_unit === "CASE" && selected?.pack_size
//       ? Math.ceil(resultEach / Number(selected.pack_size || 1))
//       : null;

//   /* Mutations */
//   const addLineMut = useMutation({
//     mutationFn: async (body: any) => {
//       console.log("[GeneralCart] addLine mutate", { basketId: basket?.id, body });
//       return basketsApi.addLine(basket!.id, body);
//     },
//     onSuccess: async (r) => {
//       console.log("[GeneralCart] addLine success", r);
//       setEach(0);
//       setCurrentEach("");
//       setMode("DIRECT");
//       setSelected(null);
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//     onError: (e) => {
//       console.error("[GeneralCart] addLine ERROR", e);
//     },
//   });

//   const finalizeMut = useMutation({
//     mutationFn: (lineId: string) => {
//       console.log("[GeneralCart] finalizeLine mutate", { lineId });
//       return basketsApi.finalizeLine(lineId);
//     },
//     onSuccess: () => refetchLines(),
//     onError: (e) => console.error("[GeneralCart] finalizeLine ERROR", e),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (lineId: string) => {
//       console.log("[GeneralCart] deleteLine mutate", { lineId });
//       return basketsApi.deleteLine(lineId);
//     },
//     onSuccess: () => refetchLines(),
//     onError: (e) => console.error("[GeneralCart] deleteLine ERROR", e),
//   });

//   /* Add selected item */
//   function addSelected() {
//     if (!selected || !basket) return;
//     const myRole = (activeLocation as any)?.my_role as string | undefined;
//     const canApprove = myRole === "MANAGER" || (activeLocation as any)?.is_global_admin;
//     const needsFinalize = !canApprove;
//     const chosenSupplier = supplierId || selected.default_supplier_id || null;

//     const payload: any = {
//       item_id: selected.id,
//       supplier_id: chosenSupplier, // optional
//       qty_mode: mode,
//       qty_each_requested: resultEach, // DIRECT = exact; DIFF = computed to target
//       needs_finalize: needsFinalize,
//     };
//     if (mode === "DIFF") payload.qty_each_snapshot_on_hand = cur;

//     addLineMut.mutate(payload);
//   }

//   /* Status flags */
//   const canAdd =
//     !!basket?.id &&
//     selected &&
//     ((mode === "DIRECT" && each > 0) || (mode === "DIFF" && resultEach > 0));

//   /* UI helpers */
//   const myRole = (activeLocation as any)?.my_role as string | undefined;
//   const canApprove = myRole === "MANAGER" || (activeLocation as any)?.is_global_admin;

//   /* Force-open (re-fetch) basket for current location */
//   async function forceOpenBasket() {
//     if (!locId) return;
//     try {
//       console.log("[GeneralCart] forceOpenBasket");
//       await refetchBasket();
//       await refetchLines();
//     } catch (e) {
//       console.error("[GeneralCart] forceOpenBasket ERROR", e);
//     }
//   }

//   /* ────────────────────────────── Render ───────────────────────────── */
//   return (
//     <div className="p-6 space-y-6 max-w-5xl mx-auto">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <h1 className="text-xl font-semibold">🧺 General Cart</h1>
//           <div className="text-sm text-gray-600">
//             Location: <b>{activeLocation?.name ?? "—"}</b>{" "}
//             <span className="ml-2 text-xs px-2 py-0.5 rounded-full border">
//               Role: {myRole ?? "STAFF"}
//             </span>
//           </div>
//           {!canApprove && (
//             <div className="mt-1 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 inline-block px-2 py-0.5 rounded">
//               Items you add must be approved by a manager/global admin.
//             </div>
//           )}

//           {/* Surface any API errors prominently */}
//           {basketErr && (
//             <div className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 inline-block px-2 py-0.5 rounded">
//               {(basketErr as any)?.message || "Failed to open cart"}
//             </div>
//           )}
//           {linesErr && (
//             <div className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 inline-block px-2 py-0.5 rounded">
//               {(linesErr as any)?.message || "Failed to load cart lines"}
//             </div>
//           )}
//         </div>

//         <div className="text-right text-sm">
//           <div>
//             Basket:{" "}
//             <span className="font-mono">{basket?.id ?? "—"}</span> — Lines:{" "}
//             <b>{lines.length}</b>
//           </div>
//           <div className="mt-2 flex gap-2 justify-end">
//             <button className="btn" onClick={() => { refetchBasket(); refetchLines(); }}>
//               Refresh
//             </button>
//             <button className="btn btn-ghost" onClick={forceOpenBasket}>
//               Force open basket
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Quick warnings */}
//       {!locId && (
//         <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
//           <b>locId is undefined.</b> Pick an active location first (check your top-bar switch,
//           or verify <code>useActiveLocation</code> is providing an ID).
//         </div>
//       )}

//       {/* Debug grid */}
//       <details open className="rounded border p-3">
//         <summary className="cursor-pointer select-none text-sm text-gray-600">
//           Debug
//         </summary>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
//           <CodeDump title="locId" data={locId} />
//           <CodeDump title="basket (raw)" data={basket} />
//           <CodeDump title="rawLines (from API)" data={rawLines} />
//           <CodeDump title="lines (normalized)" data={lines} />
//           <CodeDump
//             title="itemsAll (for hydration)"
//             data={{ count: itemsAll.length, sample: itemsAll.slice(0, 3) }}
//           />
//           <CodeDump
//             title="suppliers"
//             data={{ count: suppliers.length, sample: suppliers.slice(0, 3) }}
//           />
//           <CodeDump
//             title="status flags"
//             data={{
//               loadingBasket,
//               loadingLines,
//               canAdd,
//             }}
//           />
//           <CodeDump
//             title="selection state"
//             data={{
//               selected,
//               mode,
//               each,
//               currentEach,
//               targetEach,
//               resultEach,
//               resultCases,
//               supplierId,
//             }}
//           />
//         </div>
//       </details>

//       {/* Search & select */}
//       <div className="card p-4 space-y-4">
//         <div className="flex gap-2">
//           <div className="relative flex-1">
//             <input
//               className="input pl-10 w-full"
//               placeholder="Search items (name / SKU / barcode)"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && doSearch()}
//             />
//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//               🔎
//             </span>
//           </div>
//           <button className="btn btn-primary" onClick={doSearch} disabled={!locId}>
//             Search
//           </button>
//         </div>

//         {results.length > 0 && (
//           <div className="max-h-60 overflow-auto rounded border">
//             {results.map((it) => {
//               const isSel = selected?.id === it.id;
//               const alreadyEach = inCartMap.get(it.id) || 0;
//               return (
//                 <div
//                   key={it.id}
//                   className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
//                     isSel ? "bg-gray-50" : ""
//                   }`}
//                   onClick={() => setSelected(it)}
//                 >
//                   <div>
//                     <div className="font-medium flex items-center gap-2">
//                       <span>{it.name}</span>
//                       {alreadyEach > 0 && (
//                         <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
//                           In cart: {alreadyEach} each
//                         </span>
//                       )}
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       {it.order_unit}
//                       {it.order_unit === "CASE" && it.pack_size
//                         ? ` (${it.pack_size}/case)`
//                         : ""}{" "}
//                       · target {it.default_target_qty ?? 0}
//                     </div>
//                   </div>
//                   {isSel && <span className="text-xs text-blue-600">selected</span>}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Responsive editor */}
//         {selected && (
//           <div className="border-t pt-4">
//             <div className="grid gap-4 sm:grid-cols-2">
//               {/* Qty side */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">{selected.name}</div>

//                 <div className="flex items-center gap-3">
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name="qtymode"
//                       checked={mode === "DIRECT"}
//                       onChange={() => setMode("DIRECT")}
//                     />
//                     Direct amount
//                   </label>
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name="qtymode"
//                       checked={mode === "DIFF"}
//                       onChange={() => setMode("DIFF")}
//                     />
//                     Differential to target
//                   </label>
//                 </div>

//                 {mode === "DIRECT" ? (
//                   <label className="text-sm">
//                     Each (required)
//                     <input
//                       className="input mt-1"
//                       type="number"
//                       min={0}
//                       step={1}
//                       value={each || ""}
//                       onChange={(e) =>
//                         setEach(e.target.value === "" ? 0 : Math.max(Number(e.target.value), 0))
//                       }
//                     />
//                   </label>
//                 ) : (
//                   <div className="grid grid-cols-1 gap-2">
//                     <div className="text-xs text-gray-600">
//                       Target each: <b>{targetEach}</b>
//                     </div>
//                     <label className="text-sm">
//                       Current on-hand (each)
//                       <input
//                         className="input mt-1"
//                         type="number"
//                         min={0}
//                         step={1}
//                         value={currentEach}
//                         onChange={(e) =>
//                           setCurrentEach(
//                             e.target.value === "" ? "" : Math.max(Number(e.target.value), 0)
//                           )
//                         }
//                       />
//                     </label>
//                     <div className="text-xs text-gray-600">
//                       Will add: <b>{diffEach}</b> each
//                       {resultCases != null ? `  ·  ≈ ${resultCases} case(s)` : ""}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Supplier side */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">Supplier (optional)</div>
//                 <select
//                   className="input"
//                   value={supplierId}
//                   onChange={(e) => setSupplierId(e.target.value)}
//                 >
//                   <option value="">— No supplier —</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//                 <div className="text-xs text-gray-600">
//                   Leave blank to keep the default/none. You can assign a supplier later.
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4">
//               <button
//                 className="btn btn-primary disabled:opacity-60"
//                 disabled={addLineMut.isPending || !canAdd}
//                 onClick={addSelected}
//               >
//                 {addLineMut.isPending ? "Adding…" : "Add to cart"}
//               </button>
//               <button className="btn btn-ghost ml-2" onClick={() => setSelected(null)}>
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Lines list */}
//       <div className="card overflow-hidden">
//         <div className="px-4 py-3 border-b font-medium flex items-center gap-2">
//           Current lines
//           <span className="text-xs text-gray-500">
//             ({lines.length} item{lines.length === 1 ? "" : "s"})
//           </span>
//         </div>

//         {loadingLines ? (
//           <div className="p-4 text-sm text-gray-500">Loading…</div>
//         ) : lines.length === 0 ? (
//           <div className="p-4 text-sm text-gray-500">
//             No lines yet. (If you just added something but see nothing here, compare the debug
//             “basket (raw)” and “rawLines (from API)” above — likely an RLS/user/location mismatch.)
//           </div>
//         ) : (
//           <div className="divide-y">
//             {lines.map((ln) => (
//               <div
//                 key={ln.id}
//                 className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
//               >
//                 <div>
//                   <div className="font-medium">{ln.item?.name ?? "Item"}</div>
//                   <div className="text-xs text-gray-500">
//                     {ln.qty_mode === "DIFF" ? "Differential" : "Direct"} ·{" "}
//                     {ln.qty_each_requested} each
//                     {ln.item?.order_unit === "CASE" && ln.item?.pack_size
//                       ? ` · ≈ ${Math.ceil(ln.qty_each_requested / ln.item.pack_size)} case(s)`
//                       : ""}
//                     {ln.supplier?.name ? ` · Supplier: ${ln.supplier.name}` : ""}
//                   </div>
//                   {ln.needs_finalize && (
//                     <div className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
//                       Needs manager approval
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex gap-2 self-start sm:self-auto">
//                   {ln.needs_finalize && canApprove && (
//                     <button
//                       className="btn btn-primary"
//                       disabled={finalizeMut.isPending}
//                       onClick={() => finalizeMut.mutate(ln.id)}
//                     >
//                       {finalizeMut.isPending ? "…" : "Finalize"}
//                     </button>
//                   )}
//                   <button
//                     className="btn"
//                     disabled={deleteMut.isPending}
//                     onClick={() => deleteMut.mutate(ln.id)}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="text-xs text-gray-500">
//         Next: go to{" "}
//         <a className="underline" href="/app/orders/review">
//           Review &amp; Place
//         </a>{" "}
//         to move finalized lines into POs.
//       </div>
//     </div>
//   );
// }

// import React from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useActiveLocation } from "../../lib/activeLocation";
// import { useMe } from "../../lib/useMe";
// import { itemsApi, basketsApi, suppliersApi } from "../../lib/api/inventory";

// /* ----------------------------- Minimal types ----------------------------- */
// type Item = {
//   id: string;
//   name: string;
//   order_unit: "EACH" | "CASE";
//   pack_size: number;
//   default_target_qty?: number | null;
//   default_supplier_id?: string | null;
//   sku?: string | null;
//   barcode?: string | null;
// };

// type Line = {
//   id: string;
//   needs_finalize: boolean;
//   qty_mode: "DIRECT" | "DIFF";
//   qty_each_requested: number;
//   qty_each_snapshot_on_hand?: number | null;
//   item?: Item;
//   item_id?: string;

//   // IMPORTANT: many APIs return one or more of these; we’ll handle all cases
//   supplier_id?: string | null;
//   supplier?: { id?: string; name?: string | null } | null;
// };

// type Basket = { id: string; location_id: string; status: string };

// /* ----------------------------- Helpers ----------------------------- */
// function capToTarget({
//   item,
//   alreadyInCart,
//   requested,
// }: {
//   item: Item;
//   alreadyInCart: number;
//   requested: number;
// }) {
//   const target = Number(item.default_target_qty || 0);
//   if (target <= 0) return requested; // no target configured
//   const remaining = Math.max(target - alreadyInCart, 0);
//   if (requested <= remaining) return requested;

//   if (remaining <= 0) {
//     alert(
//       `Target is ${target} and you already have ${alreadyInCart} in the cart for “${item.name}”.`
//     );
//     return 0;
//   }
//   const ok = confirm(
//     `“${item.name}” has a target of ${target}.\n` +
//       `Already in cart: ${alreadyInCart}.\n` +
//       `Do you want to add only the remaining ${remaining} to reach the target?`
//   );
//   return ok ? remaining : 0;
// }

// /** Resolve a line’s supplier ID in a robust way:
//  *  1) line.supplier_id
//  *  2) line.supplier?.id
//  *  3) match line.supplier?.name to suppliers[] to find ID
//  *  4) fallback to item.default_supplier_id
//  */
// function getLineSupplierId(
//   ln: Line,
//   suppliersByName: Map<string, string>,
//   itemDefaultSupplierId?: string | null
// ): string | null {
//   if (ln.supplier_id) return ln.supplier_id;
//   if (ln.supplier && ln.supplier.id) return ln.supplier.id || null;
//   if (ln.supplier && ln.supplier.name) {
//     const id = suppliersByName.get((ln.supplier.name || "").trim().toLowerCase());
//     if (id) return id;
//   }
//   return itemDefaultSupplierId ?? null;
// }

// /** Resolve a line’s supplier NAME: prefer line.supplier?.name, otherwise map the ID. */
// function getLineSupplierName(
//   ln: Line,
//   suppliersById: Map<string, any>,
//   itemDefaultSupplierId?: string | null
// ): string | null {
//   if (ln.supplier?.name) return ln.supplier.name || null;
//   const id = ln.supplier_id ?? itemDefaultSupplierId ?? null;
//   if (id && suppliersById.has(id)) return suppliersById.get(id)?.name || null;
//   return null;
// }

// /* =========================================================================
//    PAGE
//    ========================================================================= */
// export default function OrdersGeneral() {
//   const qc = useQueryClient();

//   // Role/Admin from correct sources
//   const { activeId: locId, myLocations = [] } = useActiveLocation();
//   const { data: me } = useMe();
//   const myRole = myLocations.find((l) => l.id === (locId || ""))?.my_role || undefined;
//   const isAdmin = !!me?.is_global_admin;
//   const canApprove = isAdmin || myRole === "MANAGER";

//   /* Basket */
//   const { data: basket, refetch: refetchBasket } = useQuery<Basket | undefined>({
//     enabled: !!locId,
//     queryKey: ["basket", locId],
//     queryFn: () => basketsApi.getOrCreate(locId!),
//   });

//   /* Lines */
//   const {
//     data: rawLines = [],
//     isFetching: loadingLines,
//     refetch: refetchLines,
//   } = useQuery<Line[]>({
//     enabled: !!basket?.id,
//     queryKey: ["basket-lines", basket?.id ?? "none"],
//     queryFn: () => basketsApi.lines(basket!.id),
//   });

//   /* All items (to hydrate lines that only return item_id) */
//   const { data: itemsAll = [] } = useQuery<Item[]>({
//     enabled: !!locId,
//     queryKey: ["items-all", locId],
//     queryFn: () => itemsApi.list(locId!, ""),
//   });
//   const itemsById = React.useMemo(
//     () => Object.fromEntries(itemsAll.map((i) => [i.id, i] as const)),
//     [itemsAll]
//   );

//   /* Suppliers */
//   const { data: suppliers = [] } = useQuery({
//     enabled: !!locId,
//     queryKey: ["suppliers", locId],
//     queryFn: () => suppliersApi.list(locId!, ""),
//   });

//   // Build quick lookup maps for supplier ID/Name resolution
//   const suppliersById = React.useMemo(() => {
//     const m = new Map<string, any>();
//     suppliers.forEach((s: any) => m.set(s.id, s));
//     return m;
//   }, [suppliers]);

//   const suppliersByName = React.useMemo(() => {
//     const m = new Map<string, string>();
//     suppliers.forEach((s: any) => m.set(String(s.name || "").trim().toLowerCase(), s.id));
//     return m;
//   }, [suppliers]);

//   /* Normalize lines (ensure ln.item exists when possible) */
//   const lines: Line[] = React.useMemo(
//     () =>
//       (rawLines || []).map((ln) => ({
//         ...ln,
//         item: ln.item || (ln.item_id ? itemsById[ln.item_id] : undefined),
//       })),
//     [rawLines, itemsById]
//   );

//   /* Totals per item for “already in cart” and target checks */
//   const inCartMap = React.useMemo(() => {
//     const m = new Map<string, number>();
//     for (const ln of lines) {
//       const id = ln.item?.id || ln.item_id;
//       if (!id) continue;
//       m.set(id, (m.get(id) || 0) + Number(ln.qty_each_requested || 0));
//     }
//     return m;
//   }, [lines]);

//   /* Search */
//   const [q, setQ] = React.useState("");
//   const [results, setResults] = React.useState<Item[]>([]);
//   const doSearch = React.useCallback(async () => {
//     if (!locId || !q.trim()) return setResults([]);
//     const list = await itemsApi.list(locId, q);
//     setResults(list);
//   }, [locId, q]);

//   // Sort results: items already in cart appear first
//   const sortedResults = React.useMemo(() => {
//     return [...results].sort((a, b) => {
//       const aIn = (inCartMap.get(a.id) || 0) > 0 ? 0 : 1;
//       const bIn = (inCartMap.get(b.id) || 0) > 0 ? 0 : 1;
//       if (aIn !== bIn) return aIn - bIn;
//       return (a.name || "").localeCompare(b.name || "");
//     });
//   }, [results, inCartMap]);

//   /* Selection + qty entry */
//   const [selected, setSelected] = React.useState<Item | null>(null);
//   const [mode, setMode] = React.useState<"DIRECT" | "DIFF">("DIRECT");
//   const [each, setEach] = React.useState(0); // DIRECT
//   const [currentEach, setCurrentEach] = React.useState<number | "">(""); // DIFF
//   const [supplierId, setSupplierId] = React.useState<string | "">("");

//   // prefill default supplier when switching selected item
//   React.useEffect(() => {
//     setSupplierId(selected?.default_supplier_id || "");
//   }, [selected?.id]);

//   const targetEach = Number(selected?.default_target_qty ?? 0);
//   const cur = currentEach === "" ? 0 : Number(currentEach);
//   const diffEach = Math.max(targetEach - cur, 0);
//   const resultEach = mode === "DIRECT" ? each : diffEach;

//   /* Mutations */
//   const addLineMut = useMutation({
//     mutationFn: (body: any) => basketsApi.addLine(basket!.id, body),
//     onSuccess: async () => {
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//   });

//   const updateLineMut = useMutation({
//     mutationFn: ({ id, patch }: { id: string; patch: any }) =>
//       basketsApi.updateLine(id, patch),
//     onSuccess: async () => {
//       await refetchLines();
//       qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
//     },
//   });

//   const deleteMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.deleteLine(lineId),
//     onSuccess: () => refetchLines(),
//   });

//   const finalizeMut = useMutation({
//     mutationFn: (lineId: string) => basketsApi.finalizeLine(lineId),
//     onSuccess: () => refetchLines(),
//   });

//   /* One-line-per-item add: bump existing if present, else create */
//   async function addSelected() {
//     if (!selected || !basket) return;

//     const already = inCartMap.get(selected.id) || 0;
//     let requested = Number(resultEach || 0);
//     requested = capToTarget({
//       item: selected,
//       alreadyInCart: already,
//       requested,
//     });
//     if (requested <= 0) return;

//     const existingLine = lines.find(
//       (ln) => (ln.item?.id || ln.item_id) === selected.id
//     );

//     const needsFinalize = !canApprove;
//     const chosenSupplier = supplierId || selected.default_supplier_id || null;

//     if (existingLine) {
//       const newQty = existingLine.qty_each_requested + requested;
//       const cap = capToTarget({
//         item: selected,
//         alreadyInCart: already - existingLine.qty_each_requested,
//         requested: newQty,
//       });
//       if (cap <= 0) return;
//       await updateLineMut.mutateAsync({
//         id: existingLine.id,
//         patch: { qty_each_requested: cap },
//       });
//     } else {
//       const body: any = {
//         item_id: selected.id,
//         supplier_id: chosenSupplier,
//         qty_mode: mode,
//         qty_each_requested: requested,
//         needs_finalize: needsFinalize,
//       };
//       if (mode === "DIFF") body.qty_each_snapshot_on_hand = cur;
//       await addLineMut.mutateAsync(body);
//     }

//     // clear UI
//     setEach(0);
//     setCurrentEach("");
//     setMode("DIRECT");
//     setSelected(null);
//   }

//   /* Quick adjusters inside the cart (respect target) */
//   function adjustLine(ln: Line, delta: number) {
//     const item = ln.item || (ln.item_id ? itemsById[ln.item_id] : undefined);
//     if (!item) return;

//     const totalForItem = inCartMap.get(item.id) || 0;
//     const after = ln.qty_each_requested + delta;

//     if (after <= 0) {
//       deleteMut.mutate(ln.id);
//       return;
//     }

//     const otherLinesQty = totalForItem - ln.qty_each_requested;
//     const requestedForThisLine = capToTarget({
//       item,
//       alreadyInCart: otherLinesQty,
//       requested: after,
//     });
//     if (requestedForThisLine <= 0) return;

//     updateLineMut.mutate({
//       id: ln.id,
//       patch: { qty_each_requested: requestedForThisLine },
//     });
//   }

//   const canAdd =
//     !!basket?.id &&
//     selected &&
//     ((mode === "DIRECT" && each > 0) || (mode === "DIFF" && resultEach > 0));

//   /* ───────── Filters and counts for table ───────── */
//   const [lineSupplierFilter, setLineSupplierFilter] = React.useState<string>("");
//   const [lineStatusFilter, setLineStatusFilter] =
//     React.useState<"ALL" | "FINALIZED" | "PENDING">("ALL");

//   const finalizedCount = React.useMemo(
//     () => lines.filter((ln) => !ln.needs_finalize).length,
//     [lines]
//   );
//   const pendingCount = lines.length - finalizedCount;

//   // IMPORTANT: use the resolver so filter reacts correctly
//   const filteredLines = React.useMemo(() => {
//     return lines.filter((ln) => {
//       if (lineStatusFilter === "FINALIZED" && ln.needs_finalize) return false;
//       if (lineStatusFilter === "PENDING" && !ln.needs_finalize) return false;

//       if (lineSupplierFilter) {
//         const supplierIdResolved = getLineSupplierId(
//           ln,
//           suppliersByName,
//           ln.item?.default_supplier_id ?? null
//         );
//         if (supplierIdResolved !== lineSupplierFilter) return false;
//       }
//       return true;
//     });
//   }, [lines, lineStatusFilter, lineSupplierFilter, suppliersByName]);

//   /* --------------------------------- UI --------------------------------- */
//   return (
//     <div className="p-6 space-y-6 max-w-6xl mx-auto">
//       {/* Header */}
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <h1 className="text-xl font-semibold">🧺 General Cart</h1>
//           <div className="text-sm text-gray-600">
//             Active location:{" "}
//             <b>
//               {myLocations.find((l) => l.id === (locId || ""))?.name ?? "—"}
//             </b>{" "}
//             <span className="ml-2 text-xs px-2 py-0.5 rounded-full border">
//               Role: {isAdmin ? "GLOBAL ADMIN" : myRole ? myRole : "STAFF"}
//             </span>
//           </div>
//           {!canApprove && (
//             <div className="mt-1 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 inline-block px-2 py-0.5 rounded">
//               Items you add must be approved by a manager/global admin.
//             </div>
//           )}
//           {/* Counts */}
//           <div className="mt-2 flex gap-2 text-xs">
//             <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
//               Finalized: <b className="ml-1">{finalizedCount}</b>
//             </span>
//             <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200">
//               Pending: <b className="ml-1">{pendingCount}</b>
//             </span>
//             <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border">
//               Total: <b className="ml-1">{lines.length}</b>
//             </span>
//           </div>
//         </div>

//         <div className="text-right text-sm">
//           <div>
//             Basket: <span className="font-mono">{basket?.id ?? "—"}</span> — Lines:{" "}
//             <b>{lines.length}</b>
//           </div>
//           <div className="mt-2 flex gap-2 justify-end">
//             <button
//               className="btn"
//               onClick={() => {
//                 refetchBasket();
//                 refetchLines();
//               }}
//             >
//               Refresh
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Search & select */}
//       <div className="card p-4 space-y-4">
//         <div className="flex gap-2">
//           <div className="relative flex-1">
//             <input
//               className="input pl-10 w-full"
//               placeholder="Search items (name / SKU / barcode)"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && doSearch()}
//             />
//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//               🔎
//             </span>
//           </div>
//           <button
//             className="btn btn-primary"
//             onClick={doSearch}
//             disabled={!locId}
//           >
//             Search
//           </button>
//         </div>

//         {sortedResults.length > 0 && (
//           <div className="max-h-60 overflow-auto rounded border">
//             {sortedResults.map((it) => {
//               const isSel = selected?.id === it.id;
//               const alreadyEach = inCartMap.get(it.id) || 0;
//               const alreadyInCart = alreadyEach > 0;

//               return (
//                 <div
//                   key={it.id}
//                   className={`px-3 py-2 flex items-center justify-between ${
//                     isSel ? "bg-gray-50" : "hover:bg-gray-50"
//                   }`}
//                   onClick={() => !alreadyInCart && setSelected(it)}
//                 >
//                   <div className="min-w-0">
//                     <div className="font-medium flex items-center gap-2">
//                       <span className="truncate">{it.name}</span>
//                       {alreadyEach > 0 && (
//                         <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
//                           In cart: {alreadyEach} each
//                         </span>
//                       )}
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       {it.order_unit}
//                       {it.order_unit === "CASE" && it.pack_size
//                         ? ` (${it.pack_size}/case)`
//                         : ""}{" "}
//                       · target {it.default_target_qty ?? 0}
//                     </div>
//                   </div>

//                   {alreadyInCart ? (
//                     <span className="text-[11px] text-gray-500">
//                       Edit in table below
//                     </span>
//                   ) : (
//                     isSel && (
//                       <span className="text-xs text-blue-600">selected</span>
//                     )
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Add editor (only when item isn’t already in the cart) */}
//         {selected && (inCartMap.get(selected.id) || 0) === 0 && (
//           <div className="border-t pt-4">
//             <div className="grid gap-4 sm:grid-cols-2">
//               {/* Quantity side */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">{selected.name}</div>

//                 <div className="flex items-center gap-3">
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name="qtymode"
//                       checked={mode === "DIRECT"}
//                       onChange={() => setMode("DIRECT")}
//                     />
//                     Direct amount
//                   </label>
//                   <label className="text-sm flex items-center gap-2">
//                     <input
//                       type="radio"
//                       name="qtymode"
//                       checked={mode === "DIFF"}
//                       onChange={() => setMode("DIFF")}
//                     />
//                     Differential to target
//                   </label>
//                 </div>

//                 {mode === "DIRECT" ? (
//                   <label className="text-sm">
//                     Each (required)
//                     <input
//                       className="input mt-1"
//                       type="number"
//                       min={0}
//                       step={1}
//                       value={each || ""}
//                       onChange={(e) =>
//                         setEach(
//                           e.target.value === ""
//                             ? 0
//                             : Math.max(Number(e.target.value), 0)
//                         )
//                       }
//                     />
//                   </label>
//                 ) : (
//                   <div className="grid grid-cols-1 gap-2">
//                     <div className="text-xs text-gray-600">
//                       Target each: <b>{targetEach}</b>
//                     </div>
//                     <label className="text-sm">
//                       Current on-hand (each)
//                       <input
//                         className="input mt-1"
//                         type="number"
//                         min={0}
//                         step={1}
//                         value={currentEach}
//                         onChange={(e) =>
//                           setCurrentEach(
//                             e.target.value === ""
//                               ? ""
//                               : Math.max(Number(e.target.value), 0)
//                           )
//                         }
//                       />
//                     </label>
//                     <div className="text-xs text-gray-600">
//                       Will add: <b>{diffEach}</b> each
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Supplier side */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">Supplier (optional)</div>
//                 <select
//                   className="input"
//                   value={supplierId}
//                   onChange={(e) => setSupplierId(e.target.value)}
//                 >
//                   <option value="">— No supplier —</option>
//                   {suppliers.map((s: any) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//                 <div className="text-xs text-gray-600">
//                   Leave blank to use the item’s default supplier (if any).
//                 </div>
//               </div>
//             </div>

//             <div className="mt-4">
//               <button
//                 className="btn btn-primary disabled:opacity-60"
//                 disabled={addLineMut.isPending || !canAdd}
//                 onClick={addSelected}
//               >
//                 {addLineMut.isPending ? "Adding…" : "Add to cart"}
//               </button>
//               <button
//                 className="btn btn-ghost ml-2"
//                 onClick={() => setSelected(null)}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Filters for lines */}
//       <div className="flex flex-wrap items-end gap-3">
//         <div>
//           <div className="text-xs text-gray-600 mb-1">Status</div>
//           <select
//             className="input"
//             value={lineStatusFilter}
//             onChange={(e) => setLineStatusFilter(e.target.value as any)}
//           >
//             <option value="ALL">All</option>
//             <option value="FINALIZED">Finalized</option>
//             <option value="PENDING">Pending</option>
//           </select>
//         </div>

//         <div>
//           <div className="text-xs text-gray-600 mb-1">Supplier</div>
//           <select
//             className="input min-w-[180px]"
//             value={lineSupplierFilter}
//             onChange={(e) => setLineSupplierFilter(e.target.value)}
//           >
//             <option value="">All suppliers</option>
//             {suppliers.map((s: any) => (
//               <option key={s.id} value={s.id}>
//                 {s.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <button
//           className="btn btn-ghost"
//           onClick={() => {
//             setLineStatusFilter("ALL");
//             setLineSupplierFilter("");
//           }}
//           title="Clear line filters"
//         >
//           Clear
//         </button>
//       </div>

//       {/* Lines table */}
//       <div className="card overflow-hidden">
//         <div className="px-4 py-3 border-b font-medium">Current lines</div>

//         {loadingLines ? (
//           <div className="p-4 text-sm text-gray-500">Loading…</div>
//         ) : filteredLines.length === 0 ? (
//           <div className="p-4 text-sm text-gray-500">No lines match filters.</div>
//         ) : (
//           <div className="overflow-auto">
//             <table className="min-w-full border-collapse">
//               <thead className="bg-gray-50 sticky top-0 z-10">
//                 <tr>
//                   <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
//                     Item
//                   </th>
//                   <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
//                     Mode
//                   </th>
//                   <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
//                     Qty (each)
//                   </th>
//                   <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
//                     Target / In cart
//                   </th>
//                   <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
//                     Supplier
//                   </th>
//                   <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
//                     Status
//                   </th>
//                   <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700 w-[220px]">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredLines.map((ln, i) => {
//                   const item =
//                     ln.item ||
//                     (ln.item_id ? itemsById[ln.item_id!] : undefined);
//                   const totalForItem = item
//                     ? inCartMap.get(item.id) || 0
//                     : ln.qty_each_requested;

//                   // Supplier display uses same resolver system
//                   const supName =
//                     getLineSupplierName(ln, suppliersById, item?.default_supplier_id ?? null) ||
//                     "—";

//                   return (
//                     <tr
//                       key={ln.id}
//                       className={`transition-colors ${
//                         i % 2 ? "bg-gray-50/60" : "bg-white"
//                       } hover:bg-brand-50/60`}
//                     >
//                       <td className="border-t px-3 py-3 text-sm">
//                         <div className="font-medium">
//                           {item?.name ?? "Item"}
//                         </div>
//                         <div className="text-[11px] text-gray-500">
//                           {item?.order_unit}
//                           {item?.order_unit === "CASE" && item?.pack_size
//                             ? ` (${item.pack_size}/case)`
//                             : ""}
//                         </div>
//                       </td>
//                       <td className="border-t px-3 py-3 text-sm">
//                         {ln.qty_mode === "DIFF" ? "Differential" : "Direct"}
//                         {ln.qty_mode === "DIFF" &&
//                           typeof ln.qty_each_snapshot_on_hand === "number" && (
//                             <div className="text-[11px] text-gray-500">
//                               On-hand: {ln.qty_each_snapshot_on_hand}
//                             </div>
//                           )}
//                       </td>
//                       <td className="border-t px-3 py-3 text-sm">
//                         <div className="inline-flex items-center gap-2">
//                           <button
//                             className="btn"
//                             onClick={() => adjustLine(ln, -1)}
//                           >
//                             -1
//                           </button>
//                           <span className="min-w-[2ch] text-center">
//                             {ln.qty_each_requested}
//                           </span>
//                           <button
//                             className="btn"
//                             onClick={() => adjustLine(ln, +1)}
//                           >
//                             +1
//                           </button>
//                         </div>
//                       </td>
//                       <td className="border-t px-3 py-3 text-sm">
//                         {item?.default_target_qty
//                           ? `target ${Number(item.default_target_qty)} · in cart ${totalForItem}`
//                           : "—"}
//                       </td>
//                       <td className="border-t px-3 py-3 text-sm">
//                         {supName}
//                       </td>
//                       <td className="border-t px-3 py-3 text-sm">
//                         {ln.needs_finalize ? (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-yellow-100 text-yellow-800">
//                             Pending
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800">
//                             Finalized
//                           </span>
//                         )}
//                       </td>
//                       <td className="border-t px-3 py-3 text-sm text-right">
//                         <div className="inline-flex gap-2">
//                           {ln.needs_finalize && canApprove && (
//                             <button
//                               className="btn btn-primary"
//                               disabled={finalizeMut.isPending}
//                               onClick={() => finalizeMut.mutate(ln.id)}
//                             >
//                               {finalizeMut.isPending ? "…" : "Finalize"}
//                             </button>
//                           )}
//                           <button
//                             className="btn"
//                             disabled={deleteMut.isPending}
//                             onClick={() => deleteMut.mutate(ln.id)}
//                           >
//                             Remove
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="text-xs text-gray-500">
//         Next: go to{" "}
//         <a className="underline" href="/app/orders/review">
//           Review &amp; Place
//         </a>{" "}
//         to move finalized lines into POs.
//       </div>
//     </div>
//   );
// }


import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveLocation } from "../../lib/activeLocation";
import { useMe } from "../../lib/useMe";
import { itemsApi, basketsApi, suppliersApi } from "../../lib/api/inventory";

/* ----------------------------- Types ----------------------------- */
type Item = {
  id: string;
  name: string;
  order_unit: "EACH" | "CASE";
  pack_size: number;
  default_target_qty?: number | null;
  default_supplier_id?: string | null;
  sku?: string | null;
  barcode?: string | null;
};

type Line = {
  id: string;
  needs_finalize: boolean;
  qty_mode: "DIRECT" | "DIFF";
  qty_each_requested: number;
  qty_each_snapshot_on_hand?: number | null;
  item?: Item;
  item_id?: string;

  supplier_id?: string | null;
  supplier?: { id?: string | null; name?: string | null } | null;
};

type Basket = { id: string; location_id: string; status: string };

/* ----------------------------- Helpers ----------------------------- */
function resolveLineSupplierId(
  ln: Line,
  suppliersByName: Map<string, string>,
  itemDefaultSupplierId?: string | null
): string | null {
  if (ln.supplier_id) return ln.supplier_id;
  if (ln.supplier?.id) return ln.supplier.id || null;
  if (ln.supplier?.name) {
    const id = suppliersByName.get(String(ln.supplier.name).trim().toLowerCase());
    if (id) return id;
  }
  return itemDefaultSupplierId ?? null;
}

function resolveLineSupplierName(
  ln: Line,
  suppliersById: Map<string, any>,
  itemDefaultSupplierId?: string | null
): string | null {
  if (ln.supplier?.name) return ln.supplier.name || null;
  const id = ln.supplier_id ?? itemDefaultSupplierId ?? null;
  if (id && suppliersById.has(id)) return suppliersById.get(id)?.name || null;
  return null;
}

/* Small UI bits */
const Badge = ({
  children,
  tone = "gray",
  className = "",
}: React.PropsWithChildren<{ tone?: "gray" | "blue" | "green" | "yellow" | "red"; className?: string }>) => {
  const toneMap: Record<string, string> = {
    gray: "bg-gray-50 text-gray-700 border",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-yellow-50 text-yellow-800 border border-yellow-200",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${toneMap[tone]} ${className}`}>
      {children}
    </span>
  );
};

export default function OrdersGeneral() {
  const qc = useQueryClient();

  /* Roles */
  const { activeId: locId, myLocations = [] } = useActiveLocation();
  const { data: me } = useMe();
  const myRole = myLocations.find((l) => l.id === (locId || ""))?.my_role || undefined;
  const isAdmin = !!me?.is_global_admin;
  const canApprove = isAdmin || myRole === "MANAGER";

  /* Basket */
  const { data: basket, refetch: refetchBasket } = useQuery<Basket | undefined>({
    enabled: !!locId,
    queryKey: ["basket", locId],
    queryFn: () => basketsApi.getOrCreate(locId!),
  });

  /* Lines */
  const {
    data: rawLines = [],
    isFetching: loadingLines,
    refetch: refetchLines,
  } = useQuery<Line[]>({
    enabled: !!basket?.id,
    queryKey: ["basket-lines", basket?.id ?? "none"],
    queryFn: () => basketsApi.lines(basket!.id),
  });

  /* Items (for hydration) */
  const { data: itemsAll = [] } = useQuery<Item[]>({
    enabled: !!locId,
    queryKey: ["items-all", locId],
    queryFn: () => itemsApi.list(locId!, ""),
  });
  const itemsById = React.useMemo(
    () => Object.fromEntries(itemsAll.map((i) => [i.id, i] as const)),
    [itemsAll]
  );

  /* Suppliers */
  const { data: suppliers = [] } = useQuery({
    enabled: !!locId,
    queryKey: ["suppliers", locId],
    queryFn: () => suppliersApi.list(locId!, ""),
  });
  const suppliersById = React.useMemo(() => {
    const m = new Map<string, any>();
    suppliers.forEach((s: any) => m.set(s.id, s));
    return m;
  }, [suppliers]);
  const suppliersByName = React.useMemo(() => {
    const m = new Map<string, string>();
    suppliers.forEach((s: any) => m.set(String(s.name || "").trim().toLowerCase(), s.id));
    return m;
  }, [suppliers]);

  /* Normalize lines */
  const lines: Line[] = React.useMemo(
    () =>
      (rawLines || []).map((ln) => ({
        ...ln,
        item: ln.item || (ln.item_id ? itemsById[ln.item_id] : undefined),
      })),
    [rawLines, itemsById]
  );

  /* -------- Mutations -------- */
  const refetchLinesAndInvalidate = async () => {
    await refetchLines();
    qc.invalidateQueries({ queryKey: ["basket-lines", basket?.id] });
  };

  const updateLineMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => basketsApi.updateLine(id, patch),
    onSuccess: refetchLinesAndInvalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (lineId: string) => basketsApi.deleteLine(lineId),
    onSuccess: refetchLines,
  });

  const finalizeMut = useMutation({
    mutationFn: (lineId: string) => basketsApi.finalizeLine(lineId),
    onSuccess: refetchLines,
  });

  /* -------- Filters (single search input) -------- */
  const [lineSupplierFilter, setLineSupplierFilter] = React.useState<string>("");
  const [lineStatusFilter, setLineStatusFilter] = React.useState<"ALL" | "FINALIZED" | "PENDING">("ALL");
  const [lineTextFilter, setLineTextFilter] = React.useState<string>("");

  const filteredLines = React.useMemo(() => {
    return lines.filter((ln) => {
      if (lineStatusFilter === "FINALIZED" && ln.needs_finalize) return false;
      if (lineStatusFilter === "PENDING" && !ln.needs_finalize) return false;

      if (lineSupplierFilter) {
        const supplierIdResolved = resolveLineSupplierId(ln, suppliersByName, ln.item?.default_supplier_id ?? null);
        if (supplierIdResolved !== lineSupplierFilter) return false;
      }

      const t = lineTextFilter.trim().toLowerCase();
      if (t) {
        const it = ln.item || (ln.item_id ? itemsById[ln.item_id!] : undefined);
        const name = (it?.name || "").toLowerCase();
        const sku = (it?.sku || "").toLowerCase();
        const bc = (it?.barcode || "").toLowerCase();
        const supplierName = (
          resolveLineSupplierName(ln, suppliersById, it?.default_supplier_id ?? null) || ""
        ).toLowerCase();
        const hit = name.includes(t) || sku.includes(t) || bc.includes(t) || supplierName.includes(t);
        if (!hit) return false;
      }

      return true;
    });
  }, [lines, lineStatusFilter, lineSupplierFilter, lineTextFilter, suppliersByName, suppliersById, itemsById]);

  const finalizedCount = React.useMemo(() => filteredLines.filter((l) => !l.needs_finalize).length, [filteredLines]);
  const pendingCount   = React.useMemo(() => filteredLines.filter((l) => l.needs_finalize).length, [filteredLines]);
  const totalCount     = filteredLines.length;

  /* -------- Strict increment/decrement that never exceeds target -------- */
  function adjustLine(ln: Line, delta: number) {
    // Make sure we have the hydrated item. If not, block increments (safe default) and allow decrements.
    const item = ln.item || (ln.item_id ? itemsById[ln.item_id] : undefined);
    if (!item) {
      if (delta > 0) {
        alert("Cannot increase because the item's target is unknown. Please refresh and try again.");
        return;
      }
      const after = ln.qty_each_requested + delta;
      if (after <= 0) {
        deleteMut.mutate(ln.id);
      } else {
        updateLineMut.mutate({ id: ln.id, patch: { qty_each_requested: after } });
      }
      return;
    }

    const target = Number(item.default_target_qty || 0);
    const after = ln.qty_each_requested + delta;

    // If decreasing or removing, always allow (down to delete at 0)
    if (delta < 0) {
      if (after <= 0) {
        deleteMut.mutate(ln.id);
        return;
      }
      updateLineMut.mutate({ id: ln.id, patch: { qty_each_requested: after } });
      return;
    }

    // From here on, delta > 0 (increment path).
    if (target <= 0) {
      // No target set: free to increase
      updateLineMut.mutate({ id: ln.id, patch: { qty_each_requested: after } });
      return;
    }

    // Recompute "other lines" for THIS item from the freshest 'lines' array (no cached map).
    const itemId = item.id;
    let otherLinesQty = 0;
    for (const l of lines) {
      const lid = l.item?.id || l.item_id;
      if (!lid || lid !== itemId) continue;
      if (l.id === ln.id) continue; // exclude current line
      otherLinesQty += Number(l.qty_each_requested || 0);
    }

    const remainingForThisLine = Math.max(target - otherLinesQty, 0);

    // If already at/over target with other lines alone, block any increase.
    if (remainingForThisLine <= 0) {
      alert(
        `Cannot increase. The target for “${item.name}” is ${target} and it has already been fully reached in the cart.`
      );
      return;
    }

    // If the desired 'after' would exceed what this line is allowed to carry, block.
    if (after > remainingForThisLine) {
      alert(
        `Cannot increase beyond target. “${item.name}” target is ${target}.\n` +
        `Other lines: ${otherLinesQty} · This line can be at most ${remainingForThisLine}.`
      );
      return;
    }

    // Within limits → apply
    updateLineMut.mutate({ id: ln.id, patch: { qty_each_requested: after } });
  }

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-semibold">🧺 General Cart</h1>
            <div className="text-sm text-gray-600">
              Location:{" "}
              <b>{myLocations.find((l) => l.id === (locId || ""))?.name ?? "—"}</b>{" "}
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full border">
                Role: {isAdmin ? "GLOBAL ADMIN" : myRole ? myRole : "STAFF"}
              </span>
            </div>
            {!canApprove && (
              <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center gap-1 px-2 py-0.5 rounded">
                ⚠️ Items you add must be approved by a manager/global admin.
              </div>
            )}
          </div>

          <div className="text-right text-sm">
            <div>
              Basket: <span className="font-mono">{basket?.id ?? "—"}</span>
            </div>
            <div className="mt-2 flex gap-2 justify-end">
              <button className="btn" onClick={() => { refetchBasket(); refetchLines(); }} title="Refresh basket & lines">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="green">Finalized: <b className="ml-1">{finalizedCount}</b></Badge>
          <Badge tone="yellow">Pending: <b className="ml-1">{pendingCount}</b></Badge>
          <Badge tone="blue">Total: <b className="ml-1">{totalCount}</b></Badge>
        </div>
      </div>

      {/* Filters Bar — SINGLE SEARCH */}
      <div className="card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
          <div className="xl:col-span-3">
            <div className="text-xs text-gray-600 mb-1">Search in current cart</div>
            <div className="relative">
              <input
                className="input pl-10 w-full"
                placeholder="Filter by item / SKU / barcode / supplier"
                value={lineTextFilter}
                onChange={(e) => setLineTextFilter(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Status</div>
            <select className="input w-full" value={lineStatusFilter} onChange={(e) => setLineStatusFilter(e.target.value as any)}>
              <option value="ALL">All</option>
              <option value="FINALIZED">Finalized</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Supplier</div>
            <select className="input w-full" value={lineSupplierFilter} onChange={(e) => setLineSupplierFilter(e.target.value)}>
              <option value="">All suppliers</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex sm:col-span-1 xl:col-span-1 gap-2 sm:justify-end">
            <button
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => { setLineStatusFilter("ALL"); setLineSupplierFilter(""); setLineTextFilter(""); }}
              title="Clear filters"
            >
              Clear
            </button>

            {canApprove && pendingCount > 0 && (
              <button
                className="btn btn-primary w-full sm:w-auto"
                onClick={async () => {
                  const ids = filteredLines.filter((l) => l.needs_finalize).map((l) => l.id);
                  for (const id of ids) await finalizeMut.mutateAsync(id);
                }}
              >
                Finalize all pending in view
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lines — MOBILE (cards) */}
      <div className="md:hidden space-y-3">
        {loadingLines ? (
          <div className="card p-4 space-y-2">
            <div className="h-4 bg-gray-100 animate-pulse rounded" />
            <div className="h-4 bg-gray-100 animate-pulse rounded" />
            <div className="h-4 bg-gray-100 animate-pulse rounded" />
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="card p-4 text-sm text-gray-600">No lines match the selected filters.</div>
        ) : (
          filteredLines.map((ln) => {
            const item = ln.item || (ln.item_id ? itemsById[ln.item_id!] : undefined);
            const supName = resolveLineSupplierName(ln, suppliersById, item?.default_supplier_id ?? null) || "—";
            return (
              <div key={ln.id} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{item?.name ?? "Item"}</div>
                    <div className="text-[11px] text-gray-500">
                      {item?.order_unit}
                      {item?.order_unit === "CASE" && item?.pack_size ? ` (${item.pack_size}/case)` : ""} · Supplier: {supName}
                    </div>
                  </div>
                  {ln.needs_finalize ? <Badge tone="yellow">Pending</Badge> : <Badge tone="green">Finalized</Badge>}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded border p-2">
                    <div className="text-gray-500">Mode</div>
                    <div className="font-medium">{ln.qty_mode === "DIFF" ? "Differential" : "Direct"}</div>
                  </div>
                  <div className="rounded border p-2">
                    <div className="text-gray-500">Qty (each)</div>
                    <div className="font-medium">{ln.qty_each_requested}</div>
                  </div>
                  <div className="rounded border p-2">
                    <div className="text-gray-500">Adjust</div>
                    <div className="mt-1 flex gap-1">
                      <button className="btn flex-1" disabled={updateLineMut.isPending} onClick={() => adjustLine(ln, -1)}>-1</button>
                      <button className="btn flex-1" disabled={updateLineMut.isPending} onClick={() => adjustLine(ln, +1)}>+1</button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {ln.needs_finalize && canApprove && (
                    <button className="btn btn-primary flex-1" onClick={() => finalizeMut.mutate(ln.id)}>Finalize</button>
                  )}
                  <button className="btn flex-1" onClick={() => deleteMut.mutate(ln.id)}>Remove</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lines — DESKTOP (table) */}
      <div className="card overflow-hidden hidden md:block">
        <div className="px-4 py-3 border-b font-medium">Current lines</div>

        {loadingLines ? (
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-100 animate-pulse rounded" />
            <div className="h-4 bg-gray-100 animate-pulse rounded" />
            <div className="h-4 bg-gray-100 animate-pulse rounded" />
          </div>
        ) : filteredLines.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No lines match the selected filters.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                  <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">Mode</th>
                  <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">Qty (each)</th>
                  <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">Supplier</th>
                  <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700 w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((ln, i) => {
                  const item = ln.item || (ln.item_id ? itemsById[ln.item_id!] : undefined);
                  const supName = resolveLineSupplierName(ln, suppliersById, item?.default_supplier_id ?? null) || "—";

                  return (
                    <tr key={ln.id} className={`transition-colors ${i % 2 ? "bg-gray-50/60" : "bg-white"} hover:bg-brand-50/60`}>
                      <td className="border-t px-3 py-3 text-sm">
                        <div className="font-medium">{item?.name ?? "Item"}</div>
                        <div className="text-[11px] text-gray-500">
                          {item?.order_unit}
                          {item?.order_unit === "CASE" && item?.pack_size ? ` (${item.pack_size}/case)` : ""}
                        </div>
                      </td>
                      <td className="border-t px-3 py-3 text-sm">
                        {ln.qty_mode === "DIFF" ? "Differential" : "Direct"}
                        {ln.qty_mode === "DIFF" && typeof ln.qty_each_snapshot_on_hand === "number" && (
                          <div className="text-[11px] text-gray-500">On-hand: {ln.qty_each_snapshot_on_hand}</div>
                        )}
                      </td>
                      <td className="border-t px-3 py-3 text-sm">
                        <div className="inline-flex items-center gap-2">
                          <button className="btn" disabled={updateLineMut.isPending} onClick={() => adjustLine(ln, -1)}>-1</button>
                          <span className="min-w-[2ch] text-center">{ln.qty_each_requested}</span>
                          <button className="btn" disabled={updateLineMut.isPending} onClick={() => adjustLine(ln, +1)}>+1</button>
                        </div>
                      </td>
                      <td className="border-t px-3 py-3 text-sm">{supName}</td>
                      <td className="border-t px-3 py-3 text-sm">
                        {ln.needs_finalize ? <Badge tone="yellow">Pending</Badge> : <Badge tone="green">Finalized</Badge>}
                      </td>
                      <td className="border-t px-3 py-3 text-sm text-right">
                        <div className="inline-flex gap-2">
                          {ln.needs_finalize && canApprove && (
                            <button className="btn btn-primary" onClick={() => finalizeMut.mutate(ln.id)}>
                              Finalize
                            </button>
                          )}
                          <button className="btn" onClick={() => deleteMut.mutate(ln.id)} title="Remove from cart">
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Next: go to{" "}
        <a className="underline" href="/app/orders/review">Review &amp; Place</a>{" "}
        to move finalized lines into POs.
      </div>
    </div>
  );
}
