// server/controllers/receivingController.ts
import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function listPOs(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const location_id = String(req.query.location_id || "");
  const status = String(req.query.status || "placed");
  if (!reqStr(location_id)) return bad(res, "location_id required");

  const { data, error } = await sb
    .from("purchase_orders")
    .select("*, supplier:suppliers(*), lines:po_lines(*)")
    .eq("location_id", location_id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function getPO(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const poId = req.params.poId;
  const { data, error } = await sb
    .from("purchase_orders")
    .select("*, supplier:suppliers(*), lines:po_lines(*), grns:grns(*, lines:grn_lines(*))")
    .eq("id", poId)
    .single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function createGRN(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const { po_id } = req.body || {};
  if (!reqStr(po_id)) return bad(res, "po_id required");
  const { data, error } = await sb
    .from("grns")
    .insert({ po_id, received_by: (req as any).user?.id || null })
    .select("*")
    .single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function addGRNLine(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const grnId = req.params.grnId;
  const { item_id, qty_received_each, unit_cost } = req.body || {};
  if (!reqStr(grnId) || !reqStr(item_id)) return bad(res, "grnId(param) & item_id required");
  const { data, error } = await sb
    .from("grn_lines")
    .insert({ grn_id: grnId, item_id, qty_received_each, unit_cost })
    .select("*")
    .single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function approveGRN(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const grnId = req.params.grnId;
  if (!reqStr(grnId)) return bad(res, "grnId required");
  const { error } = await sb.rpc("approve_grn", { p_grn: grnId });
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}

export async function addInvoice(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const { po_id, supplier_invoice_no, amount, tax_amount, file_url } = req.body || {};
  if (!reqStr(po_id) || !reqStr(file_url)) return bad(res, "po_id and file_url required");

  const { data, error } = await sb
    .from("invoices")
    .insert({
      po_id,
      supplier_invoice_no,
      amount,
      tax_amount,
      file_url,
      uploaded_by: (req as any).user?.id || null,
    })
    .select("*")
    .single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}
