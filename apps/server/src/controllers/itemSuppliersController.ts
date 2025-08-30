import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function listItemSuppliers(req: Request, res: Response) {
  const sb = sbFromReq(req);
  // Filter styles:
  //   ?item_id=...            → links for one item
  //   ?location_id=...&q=...  → all links in a location with optional name filter
  const item_id = String(req.query.item_id || "");
  const location_id = String(req.query.location_id || "");
  const q = String(req.query.q || "").trim();

  let query = sb.from("item_suppliers")
    .select(`
      *,
      supplier:suppliers(*),
      item:items(name, sku, barcode)
    `)
    .order("unit_cost", { ascending: true });

  if (item_id) query = query.eq("item_id", item_id);
  if (location_id) query = query.eq("location_id", location_id);
  if (q) query = query.ilike("supplier.name", `%${q}%`);

  const { data, error } = await query;
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function createItemSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const {
    item_id, supplier_id, location_id,
    unit_cost = null, min_order_qty = null, lead_time_days = null,
  } = req.body || {};

  if (!reqStr(item_id) || !reqStr(supplier_id) || !reqStr(location_id))
    return bad(res, "item_id, supplier_id, location_id required");

  const { data, error } = await sb.from("item_suppliers").insert({
    item_id, supplier_id, location_id, unit_cost, min_order_qty, lead_time_days,
  }).select("*").single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function updateItemSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const patch = req.body || {};
  const { data, error } = await sb.from("item_suppliers").update(patch).eq("id", id).select("*").single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function deleteItemSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { error } = await sb.from("item_suppliers").delete().eq("id", id);
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}
