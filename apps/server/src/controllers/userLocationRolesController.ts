import { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

export async function listUserLocationRoles(req: Request, res: Response) {
  const sb = sbFromReq(req);
  let q = sb
    .from("user_location_roles")
    .select("user_id, location_id, role_key");
  const { user_id, location_id } = req.query as any;
  if (user_id) q = q.eq("user_id", String(user_id));
  if (location_id) q = q.eq("location_id", String(location_id));
  const { data, error } = await q;
  if (error) return res.status(403).json({ error: error.message });
  res.json(data);
}
