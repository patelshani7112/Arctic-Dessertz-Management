// server/controllers/basketController.ts
import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function getOrCreateBasket(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const location_id = String(req.query.location_id || "");
  if (!reqStr(location_id)) return bad(res, "location_id required");

  // Use existing open basket for this location, or create one
  const existing = await sb
    .from("order_baskets")
    .select("*")
    .eq("location_id", location_id)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (!existing.error && existing.data) return ok(res, existing.data);

  const { data, error } = await sb
    .from("order_baskets")
    .insert({
      location_id,
      created_by: (req as any).user?.id || null,
      status: "open",
    })
    .select("*")
    .single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function listBasketLines(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const basket_id = req.params.id;
  const { data, error } = await sb
    .from("order_basket_lines")
    .select(
      `*,
       item:items(name, sku, barcode, unit_display, order_unit, pack_size, default_target_qty),
       supplier:suppliers(name, email, phone)`
    )
    .eq("basket_id", basket_id)
    .order("created_at", { ascending: false });
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function addBasketLine(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const basket_id = req.params.id;
  const {
    item_id,
    supplier_id = null,
    qty_mode = "DIRECT",
    qty_each_requested = 0,
    qty_each_snapshot_on_hand = null,
    needs_finalize = false,
    notes = null,
  } = req.body || {};

  if (!reqStr(basket_id) || !reqStr(item_id))
    return bad(res, "basket_id (param) and item_id required");

  const { data, error } = await sb
    .from("order_basket_lines")
    .insert({
      basket_id,
      item_id,
      supplier_id,
      qty_mode,
      qty_each_requested,
      qty_each_snapshot_on_hand,
      needs_finalize,
      notes,
      created_by: (req as any).user?.id || null,
    })
    .select("*")
    .single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function updateBasketLine(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const lineId = req.params.lineId;
  const patch = req.body || {};
  const { data, error } = await sb
    .from("order_basket_lines")
    .update(patch)
    .eq("id", lineId)
    .select("*")
    .single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function deleteBasketLine(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const lineId = req.params.lineId;
  const { error } = await sb.from("order_basket_lines").delete().eq("id", lineId);
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}

export async function finalizeBasketLine(req: Request, res: Response) {
  // RLS ensures only manager/admin can flip this to false
  const sb = sbFromReq(req);
  const lineId = req.params.lineId;
  const { data, error } = await sb
    .from("order_basket_lines")
    .update({ needs_finalize: false })
    .eq("id", lineId)
    .select("*")
    .single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}
