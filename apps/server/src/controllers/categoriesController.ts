import type { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

const ok = (res: Response, data: any) => res.json(data);
const bad = (res: Response, msg = "Bad request", code = 400) =>
  res.status(code).json({ error: msg });
const reqStr = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export async function listCategories(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const location_id = String(req.query.location_id || "");
  if (!reqStr(location_id)) return bad(res, "location_id required");

  const { data, error } = await sb
    .from("categories")
    .select("*")
    .eq("location_id", location_id)
    .order("name");

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function getCategory(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { data, error } = await sb.from("categories").select("*").eq("id", id).single();
  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function createCategory(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const { location_id, name, is_active = true } = req.body || {};
  if (!reqStr(location_id) || !reqStr(name))
    return bad(res, "location_id and name required");

  const { data, error } = await sb
    .from("categories")
    .insert({ location_id, name, is_active })
    .select("*")
    .single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function updateCategory(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const patch = req.body || {};
  const { data, error } = await sb
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return bad(res, error.message, 500);
  return ok(res, data);
}

export async function deleteCategory(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const id = req.params.id;
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) return bad(res, error.message, 500);
  return ok(res, { ok: true });
}
