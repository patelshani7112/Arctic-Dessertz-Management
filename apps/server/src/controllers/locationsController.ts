import { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";
import { z } from "zod";

/** helpers */
async function getMeId(req: Request) {
  const sb = sbFromReq(req);
  const { data } = await sb.auth.getUser();
  return data?.user?.id ?? null;
}
async function getIsAdmin(req: Request, uid: string) {
  const sb = sbFromReq(req);
  const { data, error } = await sb
    .from("profiles")
    .select("is_global_admin")
    .eq("user_id", uid)
    .single();
  if (error) throw error;
  return !!data?.is_global_admin;
}
async function myLocationIds(req: Request, uid: string) {
  const sb = sbFromReq(req);
  const { data, error } = await sb
    .from("user_location_roles")
    .select("location_id, role_key")
    .eq("user_id", uid);
  if (error) throw error;
  const ids = new Set<string>();
  (data || []).forEach((r: any) => ids.add(r.location_id));
  return Array.from(ids);
}
async function isManagerOf(req: Request, uid: string, locId: string) {
  const sb = sbFromReq(req);
  const { data, error } = await sb
    .from("user_location_roles")
    .select("user_id")
    .eq("user_id", uid)
    .eq("location_id", locId)
    .eq("role_key", "MANAGER")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Create / Update schemas (match your columns) */
const AddressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough()
  .optional();

const BaseLocationSchema = z.object({
  name: z.string().min(1),
  brand_name: z.string().optional(),
  tz: z.string().min(1),
  address_json: AddressSchema,
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  open_hours_json: z.any().optional(),
  geofence_meters: z.number().int().optional(),
  printer_config_json: z.any().optional(),
  pos_external_id: z.string().optional(),
  is_active: z.boolean().optional(),
});

const CreateSchema = BaseLocationSchema;
const UpdateSchema = BaseLocationSchema.partial();

/** LIST: admin → all, others → only locations where they have any role */
export async function listLocations(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const me = await getMeId(req);
  if (!me) return res.status(401).json({ error: "Unauthorized" });

  const admin = await getIsAdmin(req, me);

  // get my roles to tag my_role on each location
  const { data: myRoles, error: rErr } = await sb
    .from("user_location_roles")
    .select("location_id, role_key")
    .eq("user_id", me);
  if (rErr) return res.status(403).json({ error: rErr.message });

  let q = sb
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });

  if (!admin) {
    const ids = Array.from(
      new Set((myRoles || []).map((r: any) => r.location_id))
    );
    if (ids.length === 0) return res.json([]);
    q = q.in("id", ids);
  }

  const { data, error } = await q;
  if (error) return res.status(403).json({ error: error.message });

  const roleByLoc = new Map<string, string>();
  (myRoles || []).forEach((r: any) => {
    // prefer MANAGER if user has multiple roles at same location
    if (!roleByLoc.has(r.location_id) || r.role_key === "MANAGER") {
      roleByLoc.set(r.location_id, r.role_key);
    }
  });

  res.json(
    (data || []).map((l: any) => ({ ...l, my_role: roleByLoc.get(l.id) }))
  );
}

/** GET one (must have access) */
export async function getLocation(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const me = await getMeId(req);
  if (!me) return res.status(401).json({ error: "Unauthorized" });
  const admin = await getIsAdmin(req, me);

  // check access for non-admin
  if (!admin) {
    const mine = await myLocationIds(req, me);
    if (!mine.includes(req.params.id))
      return res.status(403).json({ error: "Forbidden" });
  }

  const { data, error } = await sb
    .from("locations")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(403).json({ error: error.message });
  res.json(data);
}

/** CREATE (admin only) */
export async function createLocation(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const me = await getMeId(req);
  if (!me) return res.status(401).json({ error: "Unauthorized" });

  const admin = await getIsAdmin(req, me);
  if (!admin)
    return res
      .status(403)
      .json({ error: "Only global admins can create locations" });

  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const payload = { ...parsed.data, created_by: me };
  const { data, error } = await sb
    .from("locations")
    .insert(payload)
    .select("id")
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ id: data.id });
}

/** UPDATE (admin OR manager of that location) */
export async function updateLocation(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const me = await getMeId(req);
  if (!me) return res.status(401).json({ error: "Unauthorized" });

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const admin = await getIsAdmin(req, me);
  if (!admin) {
    const ok = await isManagerOf(req, me, req.params.id);
    if (!ok)
      return res.status(403).json({
        error: "Only managers of this location (or admins) can update it",
      });
  }

  const patch = { ...parsed.data, updated_at: new Date().toISOString() };
  const { error } = await sb
    .from("locations")
    .update(patch)
    .eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}

/** DELETE (admin only) */
export async function deleteLocation(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const me = await getMeId(req);
  if (!me) return res.status(401).json({ error: "Unauthorized" });

  const admin = await getIsAdmin(req, me);
  if (!admin)
    return res
      .status(403)
      .json({ error: "Only global admins can delete locations" });

  const { error } = await sb.from("locations").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
}
