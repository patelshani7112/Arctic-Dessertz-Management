// // src/lib/api/inventory.ts
// import { supabase } from "../supabase";

// const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";
// const BASE = `${API_ORIGIN}/v1`;

// /** Attach Supabase JWT + default headers */
// async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
//   const { data } = await supabase.auth.getSession();
//   const token = data?.session?.access_token;

//   const headers = new Headers(init.headers || {});
//   if (token) headers.set("Authorization", `Bearer ${token}`);
//   if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

//   return fetch(input, { ...init, headers });
// }

// /** Normalize JSON responses and surface API errors as throw */
// const j = async (r: Response) => {
//   if (!r.ok) {
//     let msg = r.statusText;
//     try {
//       const body = await r.json();
//       msg = body?.error || msg;
//     } catch {
//       /* ignore parse error */
//     }
//     throw new Error(msg);
//   }
//   return r.json();
// };

// /* ───────── Categories ───────── */
// export const categoriesApi = {
//   list: (location_id: string) =>
//     authedFetch(`${BASE}/categories?location_id=${location_id}`).then(j),

//   create: (body: { location_id: string; name: string; is_active?: boolean }) =>
//     authedFetch(`${BASE}/categories`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{ name: string; is_active: boolean }>) =>
//     authedFetch(`${BASE}/categories/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/categories/${id}`, { method: "DELETE" }).then(j),
// };

// /* ───────── Suppliers ───────── */
// export const suppliersApi = {
//   list: (location_id: string, q = "") =>
//     authedFetch(
//       `${BASE}/suppliers?location_id=${location_id}&q=${encodeURIComponent(q)}`
//     ).then(j),

//   create: (body: {
//     location_id: string;
//     name: string;
//     email?: string;
//     phone?: string;
//     address?: any;
//     payment_terms?: string;
//     preferred_contact_method?: "email" | "whatsapp";
//     is_active?: boolean;
//   }) =>
//     authedFetch(`${BASE}/suppliers`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     name: string;
//     email: string;
//     phone: string;
//     address: any;
//     payment_terms: string;
//     preferred_contact_method: "email" | "whatsapp" | null;
//     is_active: boolean;
//   }>) =>
//     authedFetch(`${BASE}/suppliers/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/suppliers/${id}`, { method: "DELETE" }).then(j),
// };

// /* ───────── Items ───────── */
// export const itemsApi = {
//   list: (location_id: string, q = "") =>
//     authedFetch(
//       `${BASE}/items?location_id=${location_id}&q=${encodeURIComponent(q)}`
//     ).then(j),

//   create: (body: {
//     location_id: string;
//     name: string;
//     category_id?: string | null;
//     sku?: string | null;
//     barcode?: string | null;
//     unit_display?: string;               // 'ea' | 'kg' | 'L'...
//     order_unit?: "EACH" | "CASE";
//     pack_size?: number;                  // 1 for EACH; e.g., 4 per CASE
//     default_target_qty?: number | null;  // for differential ordering
//     default_supplier_id?: string | null;
//     last_cost?: number | null;
//     is_active?: boolean;
//   }) =>
//     authedFetch(`${BASE}/items`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     name: string;
//     category_id: string | null;
//     sku: string | null;
//     barcode: string | null;
//     unit_display: string;
//     order_unit: "EACH" | "CASE";
//     pack_size: number;
//     default_target_qty: number | null;
//     default_supplier_id: string | null;
//     last_cost: number | null;
//     is_active: boolean;
//   }>) =>
//     authedFetch(`${BASE}/items/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/items/${id}`, { method: "DELETE" }).then(j),
// };

// /* ───────── Basket (Cart 1) ───────── */
// export const basketsApi = {
//   getOrCreate: (location_id: string) =>
//     authedFetch(`${BASE}/baskets/current?location_id=${location_id}`).then(j),

//   lines: (basket_id: string) =>
//     authedFetch(`${BASE}/baskets/${basket_id}/lines`).then(j),

//   addLine: (basket_id: string, body: any) =>
//     authedFetch(`${BASE}/baskets/${basket_id}/lines`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   updateLine: (lineId: string, body: any) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   deleteLine: (lineId: string) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}`, {
//       method: "DELETE",
//     }).then(j),

//   finalizeLine: (lineId: string) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}/finalize`, {
//       method: "POST",
//     }).then(j),
// };

// /* Item ↔ Supplier links */
// export const itemSuppliersApi = {
//   listByItem: (item_id: string) =>
//     authedFetch(`${BASE}/item-suppliers?item_id=${item_id}`).then(j),

//   create: (body: {
//     item_id: string;
//     supplier_id: string;
//     location_id: string;              // ⬅️ add this
//     order_unit?: "EACH" | "CASE";
//     pack_size?: number;
//     last_cost?: number | null;
//   }) =>
//     authedFetch(`${BASE}/item-suppliers`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     supplier_id: string;
//     location_id: string;              // ⬅️ include here too (safe if backend needs it)
//     order_unit: "EACH" | "CASE";
//     pack_size: number;
//     last_cost: number | null;
//   }>) =>
//     authedFetch(`${BASE}/item-suppliers/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/item-suppliers/${id}`, {
//       method: "DELETE",
//     }).then(j),
// };


// // apps/web/src/lib/api/inventory.ts
// import { supabase } from "../supabase";

// const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";
// const BASE = `${API_ORIGIN}/v1`;

// /** Attach Supabase JWT + default headers */
// async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
//   const { data } = await supabase.auth.getSession();
//   const token = data?.session?.access_token;

//   const headers = new Headers(init.headers || {});
//   if (token) headers.set("Authorization", `Bearer ${token}`);
//   if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

//   return fetch(input, { ...init, headers });
// }

// /** Normalize JSON responses and surface API errors as throw */
// const j = async (r: Response) => {
//   if (!r.ok) {
//     let msg = r.statusText;
//     try {
//       const body = await r.json();
//       msg = body?.error || msg;
//     } catch {
//       /* ignore parse error */
//     }
//     throw new Error(msg);
//   }
//   return r.json();
// };

// /* ───────── Categories ───────── */
// export const categoriesApi = {
//   list: (location_id: string) =>
//     authedFetch(`${BASE}/categories?location_id=${location_id}`).then(j),

//   create: (body: { location_id: string; name: string; is_active?: boolean }) =>
//     authedFetch(`${BASE}/categories`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{ name: string; is_active: boolean }>) =>
//     authedFetch(`${BASE}/categories/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/categories/${id}`, { method: "DELETE" }).then(j),
// };

// /* ───────── Suppliers ───────── */
// export const suppliersApi = {
//   list: (location_id: string, q = "") =>
//     authedFetch(`${BASE}/suppliers?location_id=${location_id}&q=${encodeURIComponent(q)}`).then(j),

//   create: (body: {
//     location_id: string;
//     name: string;
//     email?: string;
//     phone?: string;
//     address?: any;
//     payment_terms?: string;
//     preferred_contact_method?: "email" | "whatsapp";
//     is_active?: boolean;
//   }) =>
//     authedFetch(`${BASE}/suppliers`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     name: string;
//     email: string;
//     phone: string;
//     address: any;
//     payment_terms: string;
//     preferred_contact_method: "email" | "whatsapp" | null;
//     is_active: boolean;
//   }>) =>
//     authedFetch(`${BASE}/suppliers/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/suppliers/${id}`, { method: "DELETE" }).then(j),
// };

// /* ───────── Items ───────── */
// export const itemsApi = {
//   list: (location_id: string, q = "") =>
//     authedFetch(`${BASE}/items?location_id=${location_id}&q=${encodeURIComponent(q)}`).then(j),

//   create: (body: {
//     location_id: string;
//     name: string;
//     category_id?: string | null;
//     sku?: string | null;
//     barcode?: string | null;
//     unit_display?: string;               // 'ea' | 'kg' | 'L'...
//     order_unit?: "EACH" | "CASE";
//     pack_size?: number;                  // 1 for EACH; e.g., 4 per CASE
//     default_target_qty?: number | null;  // for differential ordering
//     default_supplier_id?: string | null;
//     last_cost?: number | null;
//     is_active?: boolean;
//   }) =>
//     authedFetch(`${BASE}/items`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     name: string;
//     category_id: string | null;
//     sku: string | null;
//     barcode: string | null;
//     unit_display: string;
//     order_unit: "EACH" | "CASE";
//     pack_size: number;
//     default_target_qty: number | null;
//     default_supplier_id: string | null;
//     last_cost: number | null;
//     is_active: boolean;
//   }>) =>
//     authedFetch(`${BASE}/items/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/items/${id}`, { method: "DELETE" }).then(j),
// };

// /* ───────── Basket (Cart 1) ───────── */
// export const basketsApi = {
//   getOrCreate: (location_id: string) =>
//     authedFetch(`${BASE}/baskets/current?location_id=${location_id}`).then(j),

//   lines: (basket_id: string) =>
//     authedFetch(`${BASE}/baskets/${basket_id}/lines`).then(j),

//   addLine: (basket_id: string, body: any) =>
//     authedFetch(`${BASE}/baskets/${basket_id}/lines`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   updateLine: (lineId: string, body: any) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   deleteLine: (lineId: string) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}`, {
//       method: "DELETE",
//     }).then(j),

//   finalizeLine: (lineId: string) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}/finalize`, {
//       method: "POST",
//     }).then(j),
// };

// /* ───────── Item ↔ Supplier links ─────────
//    IMPORTANT: backend requires item_id, supplier_id, *and* location_id */
// export const itemSuppliersApi = {
//   listByItem: (item_id: string) =>
//     authedFetch(`${BASE}/item-suppliers?item_id=${item_id}`).then(j),

//   create: (body: {
//     item_id: string;
//     supplier_id: string;
//     location_id: string;                // ← added/required
//     order_unit?: "EACH" | "CASE";
//     pack_size?: number;
//     last_cost?: number | null;
//   }) =>
//     authedFetch(`${BASE}/item-suppliers`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     supplier_id: string;
//     order_unit: "EACH" | "CASE";
//     pack_size: number;
//     last_cost: number | null;
//   }>) =>
//     authedFetch(`${BASE}/item-suppliers/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/item-suppliers/${id}`, { method: "DELETE" }).then(j),
// };


// apps/web/src/lib/api/inventory.ts
import { supabase } from "../supabase";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";
const BASE = `${API_ORIGIN}/v1`;

/** Attach Supabase JWT + default headers */
async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(input, { ...init, headers });
}

/** Normalize JSON responses and surface API errors as throw */
const j = async (r: Response) => {
  if (!r.ok) {
    let msg = r.statusText;
    try {
      const body = await r.json();
      msg = body?.error || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return r.json();
};

/* ───────── Categories ───────── */
export const categoriesApi = {
  list: (location_id: string) =>
    authedFetch(`${BASE}/categories?location_id=${location_id}`).then(j),

  create: (body: { location_id: string; name: string; is_active?: boolean }) =>
    authedFetch(`${BASE}/categories`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then(j),

  update: (id: string, body: Partial<{ name: string; is_active: boolean }>) =>
    authedFetch(`${BASE}/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(j),

  remove: (id: string) =>
    authedFetch(`${BASE}/categories/${id}`, { method: "DELETE" }).then(j),
};

/* ───────── Suppliers ───────── */
export const suppliersApi = {
  list: (location_id: string, q = "") =>
    authedFetch(`${BASE}/suppliers?location_id=${location_id}&q=${encodeURIComponent(q)}`).then(j),

  create: (body: {
    location_id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: any;
    payment_terms?: string;
    preferred_contact_method?: "email" | "whatsapp";
    is_active?: boolean;
  }) =>
    authedFetch(`${BASE}/suppliers`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then(j),

  update: (id: string, body: Partial<{
    name: string;
    email: string;
    phone: string;
    address: any;
    payment_terms: string;
    preferred_contact_method: "email" | "whatsapp" | null;
    is_active: boolean;
  }>) =>
    authedFetch(`${BASE}/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(j),

  remove: (id: string) =>
    authedFetch(`${BASE}/suppliers/${id}`, { method: "DELETE" }).then(j),
};

/* ───────── Items ───────── */
export const itemsApi = {
  list: (location_id: string, q = "") =>
    authedFetch(`${BASE}/items?location_id=${location_id}&q=${encodeURIComponent(q)}`).then(j),

  create: (body: {
    location_id: string;
    name: string;
    category_id?: string | null;
    sku?: string | null;
    barcode?: string | null;
    unit_display?: string;
    order_unit?: "EACH" | "CASE";
    pack_size?: number;
    default_target_qty?: number | null;
    default_supplier_id?: string | null;
    last_cost?: number | null;
    is_active?: boolean;
  }) =>
    authedFetch(`${BASE}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then(j),

  update: (id: string, body: Partial<{
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
  }>) =>
    authedFetch(`${BASE}/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(j),

  remove: (id: string) =>
    authedFetch(`${BASE}/items/${id}`, { method: "DELETE" }).then(j),
};

/* ───────── Basket (Cart 1) ───────── */
// export const basketsApi = {
//   getOrCreate: (location_id: string) =>
//     authedFetch(`${BASE}/baskets/current?location_id=${location_id}`).then(j),
//   lines: (basket_id: string) =>
//     authedFetch(`${BASE}/baskets/${basket_id}/lines`).then(j),
//   addLine: (basket_id: string, body: any) =>
//     authedFetch(`${BASE}/baskets/${basket_id}/lines`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),
//   updateLine: (lineId: string, body: any) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),
//   deleteLine: (lineId: string) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}`, { method: "DELETE" }).then(j),
//   finalizeLine: (lineId: string) =>
//     authedFetch(`${BASE}/basket-lines/${lineId}/finalize`, { method: "POST" }).then(j),
// };
// apps/web/src/lib/api/inventory.ts
// apps/web/src/lib/api/inventory.ts
export const basketsApi = {
  getOrCreate: (location_id: string) =>
    authedFetch(`${BASE}/baskets/current?location_id=${location_id}`).then(j),

  lines: async (basket_id: string) => {
    const res = await authedFetch(`${BASE}/baskets/${basket_id}/lines`).then(j);
    // normalize to array
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.lines)) return res.lines;
    if (Array.isArray(res?.data)) return res.data;
    return []; // safe fallback
  },

  addLine: (basket_id: string, body: any) =>
    authedFetch(`${BASE}/baskets/${basket_id}/lines`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then(j),

  updateLine: (lineId: string, body: any) =>
    authedFetch(`${BASE}/basket-lines/${lineId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(j),

  deleteLine: (lineId: string) =>
    authedFetch(`${BASE}/basket-lines/${lineId}`, { method: "DELETE" }).then(j),

  finalizeLine: (lineId: string) =>
    authedFetch(`${BASE}/basket-lines/${lineId}/finalize`, { method: "POST" }).then(j),
};



/* ───────── Item ↔ Supplier links ───────── */
// export const itemSuppliersApi = {
//   listByItem: (item_id: string) =>
//     authedFetch(`${BASE}/item-suppliers?item_id=${item_id}`).then(j),

//   // NOTE: server requires location_id; include it here
//   create: (body: {
//     item_id: string;
//     supplier_id: string;
//     location_id: string;
//     order_unit?: "EACH" | "CASE";
//     pack_size?: number;
//     last_cost?: number | null;
//   }) =>
//     authedFetch(`${BASE}/item-suppliers`, {
//       method: "POST",
//       body: JSON.stringify(body),
//     }).then(j),

//   update: (id: string, body: Partial<{
//     supplier_id: string;
//     order_unit: "EACH" | "CASE";
//     pack_size: number;
//     last_cost: number | null;
//   }>) =>
//     authedFetch(`${BASE}/item-suppliers/${id}`, {
//       method: "PATCH",
//       body: JSON.stringify(body),
//     }).then(j),

//   remove: (id: string) =>
//     authedFetch(`${BASE}/item-suppliers/${id}`, { method: "DELETE" }).then(j),
// };


export const itemSuppliersApi = {
  listByItem: (item_id: string) =>
    authedFetch(`${BASE}/item-suppliers?item_id=${item_id}`).then(j),

  // Create link (location_id optional; include it when you have it)
  create: (body: {
    item_id: string;
    supplier_id: string;
    location_id?: string;
    order_unit?: "EACH" | "CASE";
    pack_size?: number;
    last_cost?: number | null;
  }) => {
    const payload = {
      ...body,
      // Mirror cost to both fields so whichever the server expects is satisfied
      last_cost: body.last_cost ?? null,
      last_cost_each: body.last_cost ?? null,
    };
    return authedFetch(`${BASE}/item-suppliers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }).then(j);
  },

  // Update link (location_id optional; include it when you have it)
  update: (id: string, body: Partial<{
    supplier_id: string;
    order_unit: "EACH" | "CASE";
    pack_size: number;
    last_cost: number | null;
    location_id?: string;
  }>) => {
    const payload = {
      ...body,
      // Keep both in sync on update as well
      last_cost: body.last_cost ?? null,
      last_cost_each: body.last_cost ?? null,
    };
    return authedFetch(`${BASE}/item-suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then(j);
  },

  remove: (id: string) =>
    authedFetch(`${BASE}/item-suppliers/${id}`, { method: "DELETE" }).then(j),
};
