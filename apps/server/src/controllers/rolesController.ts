import { Request, Response } from "express";
import { supabaseAdmin } from "../supabase";
import { sbFromReq } from "../middleware/auth";

async function getUid(req: Request) {
  const sb = sbFromReq(req);
  const { data } = await sb.auth.getUser();
  return data?.user?.id ?? null;
}
async function isAdmin(uid: string) {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();
  return !!data;
}
async function isManagerOf(uid: string, locId: string) {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("user_location_roles")
    .select("user_id")
    .eq("user_id", uid)
    .eq("location_id", locId)
    .eq("role_key", "MANAGER")
    .maybeSingle();
  return !!data;
}

export async function listRoleOptions(_req: Request, res: Response) {
  res.json(["VIEW_ONLY", "CASHIER", "DISHWASHER", "COOK", "SERVER", "MANAGER"]);
}

export async function assignLocationRole(req: Request, res: Response) {
  const uid = await getUid(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const { target_user_id, location_id, new_role } = req.body || {};
  if (!target_user_id || !location_id || !new_role) {
    return res
      .status(400)
      .json({ error: "target_user_id, location_id, new_role required" });
  }

  const admin = await isAdmin(uid);
  if (!admin) {
    const ok = await isManagerOf(uid, location_id);
    if (!ok) return res.status(403).json({ error: "Forbidden" });
  }

  const adminCli = supabaseAdmin();
  const { error } = await adminCli
    .from("user_location_roles")
    .upsert(
      { user_id: target_user_id, location_id, role_key: new_role },
      { onConflict: "user_id,location_id" }
    );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}

export async function removeLocationRole(req: Request, res: Response) {
  const uid = await getUid(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const { target_user_id, location_id } = req.body || {};
  if (!target_user_id || !location_id)
    return res
      .status(400)
      .json({ error: "target_user_id, location_id required" });

  const admin = await isAdmin(uid);
  if (!admin) {
    const ok = await isManagerOf(uid, location_id);
    if (!ok) return res.status(403).json({ error: "Forbidden" });
  }

  const adminCli = supabaseAdmin();
  const { error } = await adminCli
    .from("user_location_roles")
    .delete()
    .eq("user_id", target_user_id)
    .eq("location_id", location_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}

export async function setGlobalAdmin(req: Request, res: Response) {
  const uid = await getUid(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const { target_user_id, value } = req.body || {};
  if (!target_user_id || typeof value !== "boolean")
    return res.status(400).json({ error: "target_user_id, value required" });

  const admin = await isAdmin(uid);
  if (!admin) return res.status(403).json({ error: "Only admins" });

  const adminCli = supabaseAdmin();
  const { error } = await adminCli
    .from("profiles")
    .update({ is_global_admin: value })
    .eq("user_id", target_user_id);
  if (error) return res.status(500).json({ error: error.message });
  // admins trigger keeps public.admins in sync
  res.json({ ok: true });
}
