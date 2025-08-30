import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function listItems(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const location_id = String(req.query.location_id || "");
  if (!reqStr(location_id)) return bad(res, "location_id required");

  const q = String(req.query.q || "").trim();
  const category_id = String(req.query.category_id || "");

  let query = sb.from("items")
    .select(`
      *,
      default_supplier:suppliers!items_default_supplier_id_fkey(*)
    `)
    .eq("location_id", location_id)
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
  }
  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  const { data, error } = await query;
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function getItem(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { data, error } = await sb.from("items").select("*").eq("id", id).single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function createItem(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const {
    location_id, category_id = null, name,
    sku = null, barcode = null,
    unit_display = "ea", order_unit = "EACH",
    pack_size = 1, default_target_qty = null,
    default_supplier_id = null, last_cost = null,
    is_active = true,
  } = req.body || {};
  if (!reqStr(location_id) || !reqStr(name))
    return bad(res, "location_id and name required");

  const { data, error } = await sb.from("items").insert({
    location_id, category_id, name, sku, barcode,
    unit_display, order_unit, pack_size,
    default_target_qty, default_supplier_id, last_cost,
    is_active,
  }).select("*").single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function updateItem(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const patch = req.body || {};
  const { data, error } = await sb.from("items").update(patch).eq("id", id).select("*").single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function deleteItem(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { error } = await sb.from("items").delete().eq("id", id);
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}
