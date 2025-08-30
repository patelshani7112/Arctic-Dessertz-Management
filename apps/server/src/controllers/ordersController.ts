// server/controllers/ordersController.ts
import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function placeOrderFromBasket(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const {
    location_id,
    supplier_id,
    basket_id,
    line_ids,
    expected_date = null,
    send_method = null, // 'email' | 'whatsapp' | null
    sent_to = null,
  } = req.body || {};

  if (
    !reqStr(location_id) ||
    !reqStr(supplier_id) ||
    !reqStr(basket_id) ||
    !Array.isArray(line_ids) ||
    line_ids.length === 0
  ) {
    return bad(res, "location_id, supplier_id, basket_id, line_ids[] required");
  }

  const { data, error } = await sb.rpc("place_order_from_basket", {
    p_location: location_id,
    p_supplier: supplier_id,
    p_basket: basket_id,
    p_line_ids: line_ids,
    p_expected: expected_date,
    p_send_method: send_method,
    p_send_to: sent_to,
  });

  if (error) return bad(res, error.message, 500);
  return ok(res, { po_id: data });
}
