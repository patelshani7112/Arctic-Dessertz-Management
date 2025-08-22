// apps/server/src/controllers/meController.ts
import { Request, Response } from "express";
import { sbFromReq } from "../middleware/auth";
import { supabaseAdmin } from "../supabase";

export async function getMe(req: Request, res: Response) {
  // Verify the caller's JWT with their own token
  const sbUser = sbFromReq(req);
  const { data: u, error: ue } = await sbUser.auth.getUser();
  if (ue || !u?.user) return res.status(401).json({ error: "Unauthorized" });

  // Read profile using SERVICE-ROLE (bypasses RLS safely on the server)
  const admin = supabaseAdmin();

  // Try to read their profile
  const { data: p, error: pe } = await admin
    .from("profiles")
    .select("user_id, first_name, last_name, email, is_global_admin")
    .eq("user_id", u.user.id)
    .maybeSingle();

  if (pe) return res.status(500).json({ error: pe.message });

  // If the profile row doesn't exist, create a minimal one
  let profile = p;
  if (!profile) {
    const email = u.user.email ?? "";
    const first =
      (u.user.user_metadata?.first_name as string | undefined) ?? "";
    const last = (u.user.user_metadata?.last_name as string | undefined) ?? "";
    const { data: inserted, error: ie } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: u.user.id,
          email,
          first_name: first,
          last_name: last,
          is_global_admin: false,
        },
        { onConflict: "user_id" }
      )
      .select("user_id, first_name, last_name, email, is_global_admin")
      .single();
    if (ie) return res.status(500).json({ error: ie.message });
    profile = inserted;
  }

  const full =
    profile.first_name?.trim() || profile.last_name?.trim()
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : (profile.email ?? u.user.email ?? "");

  return res.json({
    user_id: profile.user_id,
    full_name: full,
    email: profile.email ?? u.user.email,
    is_global_admin: !!profile.is_global_admin,
  });
}
