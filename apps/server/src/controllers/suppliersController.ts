import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

/* small helpers */
const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function listSuppliers(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const location_id = String(req.query.location_id || "");
  if (!reqStr(location_id)) return bad(res, "location_id required");
  const q = String(req.query.q || "").trim();

  let query = sb.from("suppliers").select("*").eq("location_id", location_id).order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data, error } = await query;
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function getSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { data, error } = await sb.from("suppliers").select("*").eq("id", id).single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function createSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const {
    location_id, name, email, phone, address, payment_terms,
    preferred_contact_method = null, is_active = true,
  } = req.body || {};
  if (!reqStr(location_id) || !reqStr(name))
    return bad(res, "location_id and name required");

  const { data, error } = await sb.from("suppliers").insert({
    location_id, name, email, phone, address, payment_terms, preferred_contact_method, is_active,
  }).select("*").single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function updateSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const patch = req.body || {};
  const { data, error } = await sb.from("suppliers").update(patch).eq("id", id).select("*").single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function deleteSupplier(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { error } = await sb.from("suppliers").delete().eq("id", id);
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}
