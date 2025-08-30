// server/controllers/archiveController.ts
import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function listArchivePOs(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const location_id = String(req.query.location_id || "");
  if (!reqStr(location_id)) return bad(res, "location_id required");

  const { data, error } = await sb
    .from("purchase_orders")
    .select("*, supplier:suppliers(*), lines:po_lines(*), grns:grns(*, lines:grn_lines(*))")
    .eq("location_id", location_id)
    .in("status", ["received", "closed", "cancelled"])
    .order("created_at", { ascending: false });

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function generateCarryOver(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const poId = req.params.poId;
  if (!reqStr(poId)) return bad(res, "poId required");
  const { error } = await sb.rpc("generate_carry_over_suggestions", { p_po: poId });
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}
