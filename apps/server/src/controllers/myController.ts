import { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";

/** For admins: return ALL locations. For others: only locations where they have a role. Also attach my_role. */
export async function listMyLocations(req: Request, res: Response) {
  const sb = sbFromReq(req);

  const { data: userData, error: ue } = await sb.auth.getUser();
  if (ue || !userData?.user)
    return res.status(401).json({ error: "Unauthorized" });
  const uid = userData.user.id;

  // What roles does the caller have per location?
  const { data: myRoles, error: rErr } = await sb
    .from("user_location_roles")
    .select("location_id, role_key")
    .eq("user_id", uid);
  if (rErr) return res.status(403).json({ error: rErr.message });

  // Am I an admin? (uses the admins table so we avoid recursion)
  const { data: amAdmin, error: aErr } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();
  if (aErr) return res.status(403).json({ error: aErr.message });

  // Build role map
  const roleByLoc = new Map<string, string>();
  (myRoles ?? []).forEach((r: any) => {
    if (!roleByLoc.has(r.location_id) || r.role_key === "MANAGER") {
      roleByLoc.set(r.location_id, r.role_key);
    }
  });

  // Admins → all locations; others → only those with assignments
  let q = sb
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false });
  if (!amAdmin) {
    const ids = Array.from(roleByLoc.keys());
    if (ids.length === 0) return res.json([]);
    q = q.in("id", ids);
  }

  const { data: locations, error: lErr } = await q;
  if (lErr) return res.status(403).json({ error: lErr.message });

  const withRole = (locations ?? []).map((l: any) => ({
    ...l,
    my_role: roleByLoc.get(l.id) || (amAdmin ? "MANAGER" : undefined), // helper label for the UI
  }));

  return res.json(withRole);
}
