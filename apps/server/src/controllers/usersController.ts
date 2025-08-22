// // server/controllers/users.ts
// import { Request, Response } from "express";
// import { randomUUID } from "crypto";
// import { sbFromReq } from "../middleware/auth";
// import { supabaseAdmin } from "../supabase";

// /* ───────────────────────────── types/helpers ─── */

// type Assignment = {
//   location_id: string;
//   location_name: string;
//   role_key: string;
// };
// type UserRow = {
//   user_id: string;
//   email: string | null;
//   first_name: string | null;
//   last_name: string | null;
//   phone?: string | null;
//   is_global_admin: boolean | null;
//   created_at?: string | null;
// };

// function fullName(u: UserRow) {
//   const f = (u.first_name || "").trim();
//   const l = (u.last_name || "").trim();
//   return f || l ? `${f} ${l}`.trim() : u.email || "";
// }

// function parseCSV(v: unknown): string[] {
//   if (!v) return [];
//   if (Array.isArray(v)) return v.flatMap(parseCSV);
//   return String(v)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// async function getUid(req: Request) {
//   const sb = sbFromReq(req);
//   const { data, error } = await sb.auth.getUser();
//   if (error || !data?.user) return null;
//   return data.user.id;
// }

// async function isAdmin(uid: string) {
//   const admin = supabaseAdmin();
//   const { data } = await admin
//     .from("admins")
//     .select("user_id")
//     .eq("user_id", uid)
//     .maybeSingle();
//   return !!data;
// }

// async function callerLocationIds(uid: string) {
//   const admin = supabaseAdmin();
//   const { data, error } = await admin
//     .from("user_location_roles")
//     .select("location_id")
//     .eq("user_id", uid);
//   if (error) throw error;
//   return Array.from(new Set((data || []).map((r: any) => r.location_id)));
// }

// async function isManagerOf(uid: string, locId: string) {
//   const admin = supabaseAdmin();
//   const { data } = await admin
//     .from("user_location_roles")
//     .select("user_id")
//     .eq("user_id", uid)
//     .eq("location_id", locId)
//     .eq("role_key", "MANAGER")
//     .maybeSingle();
//   return !!data;
// }

// function toBytea(v: any): any {
//   if (v === undefined || v === null || v === "") return null;
//   return Buffer.from(String(v), "utf8");
// }
// function safeJson(v: any) {
//   if (v === undefined || v === null || v === "") return null;
//   if (typeof v === "string") {
//     try {
//       return JSON.parse(v);
//     } catch {
//       return null;
//     }
//   }
//   if (typeof v === "object") return v;
//   return null;
// }

// /* ───────────────────────────── list/get ─── */

// export async function listUsers(req: Request, res: Response) {
//   const uid = await getUid(req);
//   if (!uid) return res.status(401).json({ error: "Unauthorized" });

//   const admin = await isAdmin(uid);

//   const q = (req.query.q as string | undefined)?.trim() || "";
//   const roles = parseCSV(req.query.roles);
//   const locFilter = parseCSV(req.query.location_ids);
//   const category = (req.query.category as string | undefined)?.toLowerCase() as
//     | "admins"
//     | "managers"
//     | "staff"
//     | undefined;

//   const sortBy = (req.query.sort_by as string) || "created_at";
//   const sortDir =
//     ((req.query.sort_dir as string) || "desc").toLowerCase() === "asc"
//       ? "asc"
//       : "desc";

//   // Restrict non-admins to their locations
//   let allowedLocIds: string[] | null = null;
//   if (!admin) {
//     allowedLocIds = await callerLocationIds(uid);
//     if (allowedLocIds.length === 0) return res.json([]);
//   }

//   const adminCli = supabaseAdmin();

//   // assignments
//   let assignQ = adminCli
//     .from("user_location_roles")
//     .select("user_id, location_id, role_key, locations(name)")
//     .order("user_id", { ascending: true });

//   if (!admin) assignQ = assignQ.in("location_id", allowedLocIds!);
//   if (locFilter.length) assignQ = assignQ.in("location_id", locFilter);
//   if (roles.length) assignQ = assignQ.in("role_key", roles);

//   const { data: roleRows, error: roleErr } = await assignQ;
//   if (roleErr) return res.status(500).json({ error: roleErr.message });

//   const byUser = new Map<string, Assignment[]>();
//   (roleRows || []).forEach((r: any) => {
//     const arr = byUser.get(r.user_id) || [];
//     arr.push({
//       location_id: r.location_id,
//       location_name: r.locations?.name ?? "",
//       role_key: r.role_key,
//     });
//     byUser.set(r.user_id, arr);
//   });

//   // if filtered or non-admin, narrow profile fetch
//   let restrictUserIds: string[] | null = null;
//   if (!admin || locFilter.length || roles.length) {
//     restrictUserIds = Array.from(byUser.keys());
//     if (restrictUserIds.length === 0) return res.json([]);
//   }

//   // profiles
//   let profQ = adminCli
//     .from("profiles")
//     .select(
//       "user_id, email, first_name, last_name, phone, is_global_admin, created_at"
//     );

//   if (restrictUserIds) profQ = profQ.in("user_id", restrictUserIds);

//   if (sortBy === "email") {
//     profQ = profQ.order("email", {
//       ascending: sortDir === "asc",
//       nullsFirst: true,
//     });
//   } else if (sortBy === "created_at") {
//     profQ = profQ.order("created_at", {
//       ascending: sortDir === "asc",
//       nullsFirst: true,
//     });
//   }

//   const { data: profs, error: profErr } = await profQ;
//   if (profErr) return res.status(500).json({ error: profErr.message });

//   // shape output
//   let out = (profs || []).map((u: UserRow) => {
//     const assigns = byUser.get(u.user_id) || [];
//     return {
//       user_id: u.user_id,
//       full_name: fullName(u),
//       email: u.email || "",
//       phone: u.phone || undefined,
//       is_global_admin: !!u.is_global_admin,
//       created_at: u.created_at || undefined,
//       assignments: assigns,
//     };
//   });

//   if (q) {
//     const ql = q.toLowerCase();
//     out = out.filter(
//       (u) =>
//         u.full_name.toLowerCase().includes(ql) ||
//         u.email.toLowerCase().includes(ql)
//     );
//   }

//   if (category) {
//     out = out.filter((u) => {
//       const hasManager = u.assignments.some((a) => a.role_key === "MANAGER");
//       if (category === "admins") return u.is_global_admin;
//       if (category === "managers") return hasManager;
//       if (category === "staff") return !u.is_global_admin;
//       return true;
//     });
//   }

//   if (sortBy === "name") {
//     out.sort((a, b) =>
//       sortDir === "asc"
//         ? a.full_name.localeCompare(b.full_name)
//         : b.full_name.localeCompare(a.full_name)
//     );
//   }

//   res.json(out);
// }

// export async function getUser(req: Request, res: Response) {
//   const uid = await getUid(req);
//   if (!uid) return res.status(401).json({ error: "Unauthorized" });

//   const adminCli = supabaseAdmin();
//   const { data: u, error } = await adminCli
//     .from("profiles")
//     .select("user_id, email, first_name, last_name, phone, is_global_admin")
//     .eq("user_id", req.params.id)
//     .maybeSingle();
//   if (error) return res.status(500).json({ error: error.message });
//   if (!u) return res.status(404).json({ error: "Not found" });

//   const { data: roles, error: rErr } = await adminCli
//     .from("user_location_roles")
//     .select("location_id, role_key, locations(name)")
//     .eq("user_id", req.params.id);
//   if (rErr) return res.status(500).json({ error: rErr.message });

//   res.json({
//     user_id: u.user_id,
//     full_name: fullName(u),
//     email: u.email || "",
//     phone: u.phone || undefined,
//     is_global_admin: !!u.is_global_admin,
//     assignments: (roles || []).map((r: any) => ({
//       location_id: r.location_id,
//       location_name: r.locations?.name ?? "",
//       role_key: r.role_key,
//     })),
//   });
// }

// /* ─────────────────────── create (attach or new) + employment ─── */

// export async function createUser(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });

//   const adminCli = supabaseAdmin();

//   // Preferred body shape:
//   // {
//   //   email: string,
//   //   password?: string, first_name?: string, last_name?: string, phone?: string,
//   //   assignments: [
//   //     {
//   //       location_id: string,
//   //       role_key: string,
//   //       employment?: {
//   //         position_title?: string | null,
//   //         employment_type?: string | null,
//   //         hire_date?: string | null,
//   //         termination_date?: string | null,
//   //         manager_user_id?: string | null,
//   //         pay_currency?: string | null,
//   //         scheduling_preferences?: any
//   //       }
//   //     }, ...
//   //   ]
//   // }
//   //
//   // Backward-compatible with legacy:
//   // { email, location_id, role_key, ... }  → converted to a single assignment.
//   const {
//     email,
//     password,
//     first_name,
//     last_name,
//     phone,
//     assignments: rawAssigns,
//     location_id,
//     role_key,
//   } = req.body || {};

//   let assignments: Array<{
//     location_id: string;
//     role_key: string;
//     employment?: {
//       position_title?: string | null;
//       employment_type?: string | null;
//       hire_date?: string | null;
//       termination_date?: string | null;
//       manager_user_id?: string | null;
//       pay_currency?: string | null;
//       scheduling_preferences?: any;
//     };
//   }> = Array.isArray(rawAssigns) ? rawAssigns : [];

//   if (!assignments.length && location_id && role_key) {
//     assignments = [{ location_id, role_key }];
//   }

//   if (!email || assignments.length === 0) {
//     return res
//       .status(400)
//       .json({ error: "email and at least one assignment are required" });
//   }

//   // Only admin or manager of EACH target location
//   const admin = await isAdmin(caller);
//   if (!admin) {
//     for (const a of assignments) {
//       const allowed = await isManagerOf(caller, a.location_id);
//       if (!allowed)
//         return res
//           .status(403)
//           .json({ error: "Forbidden: invalid location for manager" });
//     }
//   }

//   // 1) find or create user
//   const { data: existing } = await adminCli
//     .from("profiles")
//     .select("user_id")
//     .eq("email", email)
//     .maybeSingle();

//   let userId: string;
//   let status: "created" | "attached" = "attached";

//   if (!existing) {
//     // No date fields required; if password omitted, generate one.
//     const { data: authRes, error: auErr } =
//       await adminCli.auth.admin.createUser({
//         email,
//         password: password || randomUUID(),
//         email_confirm: true,
//         user_metadata: { first_name, last_name, phone },
//       });
//     if (auErr || !authRes?.user)
//       return res
//         .status(400)
//         .json({ error: auErr?.message || "Auth create failed" });

//     userId = authRes.user.id;
//     status = "created";

//     const { error: pfErr } = await adminCli.from("profiles").upsert(
//       {
//         user_id: userId,
//         email,
//         first_name: first_name ?? null,
//         last_name: last_name ?? null,
//         phone: phone ?? null,
//         is_global_admin: false,
//       },
//       { onConflict: "user_id" }
//     );
//     if (pfErr) return res.status(500).json({ error: pfErr.message });
//   } else {
//     userId = existing.user_id;
//     // Optionally update profile if extra personal fields provided
//     if (first_name || last_name || phone) {
//       await adminCli
//         .from("profiles")
//         .update({
//           first_name: first_name ?? undefined,
//           last_name: last_name ?? undefined,
//           phone: phone ?? undefined,
//         })
//         .eq("user_id", userId);
//     }
//   }

//   // 2) upsert assignments (multi) + optional per-location employment
//   for (const a of assignments) {
//     const { error: rlErr } = await adminCli
//       .from("user_location_roles")
//       .upsert(
//         { user_id: userId, location_id: a.location_id, role_key: a.role_key },
//         { onConflict: "user_id,location_id" }
//       );
//     if (rlErr) return res.status(500).json({ error: rlErr.message });

//     if (a.employment) {
//       const {
//         position_title,
//         employment_type,
//         hire_date,
//         termination_date,
//         manager_user_id,
//         pay_currency,
//         scheduling_preferences,
//       } = a.employment;

//       const { error: empErr } = await adminCli.from("user_employment").upsert(
//         {
//           user_id: userId,
//           location_id: a.location_id,
//           position_title: position_title ?? null,
//           employment_type: employment_type ?? null,
//           hire_date: hire_date ?? null,
//           termination_date: termination_date ?? null,
//           manager_user_id: manager_user_id ?? null,
//           pay_currency: pay_currency ?? null,
//           scheduling_preferences:
//             scheduling_preferences === undefined
//               ? null
//               : scheduling_preferences,
//         },
//         { onConflict: "user_id,location_id" }
//       );
//       if (empErr) return res.status(500).json({ error: empErr.message });
//     }
//   }

//   res
//     .status(201)
//     .json({ user_id: userId, status, assignments: assignments.length });
// }

// /* ───────────────────────── personal profile update ─── */

// export async function updateUser(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });

//   // Optional, non-required personal fields (email purposely excluded)
//   const {
//     first_name,
//     last_name,
//     phone,
//     date_of_birth,
//     gender,
//     avatar_url,
//     address_json,
//     emergency_contact_json,
//   } = req.body || {};

//   const adminCli = supabaseAdmin();
//   const patch: Record<string, any> = {};
//   if (first_name !== undefined) patch.first_name = first_name;
//   if (last_name !== undefined) patch.last_name = last_name;
//   if (phone !== undefined) patch.phone = phone;
//   if (date_of_birth !== undefined) patch.date_of_birth = date_of_birth;
//   if (gender !== undefined) patch.gender = gender;
//   if (avatar_url !== undefined) patch.avatar_url = avatar_url;
//   if (address_json !== undefined) patch.address_json = address_json;
//   if (emergency_contact_json !== undefined)
//     patch.emergency_contact_json = emergency_contact_json;

//   const { error } = await adminCli
//     .from("profiles")
//     .update(patch)
//     .eq("user_id", req.params.id);

//   if (error) return res.status(500).json({ error: error.message });
//   res.json({ ok: true });
// }

// /* ─────────────── employment read + upsert (per location) ─── */

// /** GET /v1/users/:id/employment?location_id=...
//  *  Admins: any location
//  *  Managers: only locations they manage
//  */
// export async function getEmployment(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });
//   const admin = await isAdmin(caller);

//   const userId = req.params.id;
//   const locationId = (req.query.location_id as string | undefined) || null;

//   const adminCli = supabaseAdmin();

//   if (locationId && !admin) {
//     const allowed = await isManagerOf(caller, locationId);
//     if (!allowed) return res.status(403).json({ error: "Forbidden" });
//   }

//   let q = adminCli
//     .from("user_employment")
//     .select(
//       "user_id, location_id, position_title, employment_type, hire_date, termination_date, manager_user_id, pay_currency, scheduling_preferences, locations(name)"
//     )
//     .eq("user_id", userId);

//   if (locationId) q = q.eq("location_id", locationId);

//   const { data, error } = await q;
//   if (error) return res.status(500).json({ error: error.message });

//   const rows =
//     data?.map((r: any) => ({
//       ...r,
//       location_name: r.locations?.name ?? "",
//       // pay_rate_enc intentionally NOT returned
//     })) ?? [];

//   res.json(rows);
// }

// /** PUT /v1/users/:id/employment
//  *  body: { location_id, position_title?, employment_type?, hire_date?, termination_date?, manager_user_id?, pay_rate?, pay_currency?, scheduling_preferences? }
//  *
//  *  Admins: any location
//  *  Managers: only locations they manage; cannot edit their own employment
//  */
// export async function upsertEmployment(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });

//   const admin = await isAdmin(caller);
//   const {
//     location_id,
//     position_title,
//     employment_type,
//     hire_date,
//     termination_date,
//     manager_user_id,
//     pay_rate,
//     pay_currency,
//     scheduling_preferences,
//   } = req.body || {};

//   if (!location_id)
//     return res.status(400).json({ error: "location_id is required" });

//   // managers: restricted to their locations + cannot edit their own employment
//   if (!admin) {
//     const allowed = await isManagerOf(caller, location_id);
//     if (!allowed) return res.status(403).json({ error: "Forbidden" });
//     if (caller === req.params.id)
//       return res
//         .status(403)
//         .json({ error: "Managers cannot edit their own employment" });
//   }

//   const adminCli = supabaseAdmin();
//   const { error } = await adminCli.from("user_employment").upsert(
//     {
//       user_id: req.params.id,
//       location_id,
//       position_title: position_title ?? null,
//       employment_type: employment_type ?? null,
//       hire_date: hire_date ?? null,
//       termination_date: termination_date ?? null,
//       manager_user_id: manager_user_id ?? (admin ? caller : undefined) ?? null,
//       pay_rate_enc: toBytea(pay_rate),
//       pay_currency: pay_currency ?? null,
//       scheduling_preferences: safeJson(scheduling_preferences),
//       updated_at: new Date().toISOString(),
//     },
//     { onConflict: "user_id,location_id" }
//   );
//   if (error) return res.status(500).json({ error: error.message });
//   res.json({ ok: true });
// }

// // server/controllers/users.ts
// import { Request, Response } from "express";
// import { randomUUID } from "crypto";
// import { sbFromReq } from "../middleware/auth";
// import { supabaseAdmin } from "../supabase";

// /* ───────────────────────────── types/helpers ─── */

// type Assignment = {
//   location_id: string;
//   location_name: string;
//   role_key: string;
// };
// type UserRow = {
//   user_id: string;
//   email: string | null;
//   first_name: string | null;
//   last_name: string | null;
//   phone?: string | null;
//   is_global_admin: boolean | null;
//   created_at?: string | null;
// };

// function fullName(u: UserRow) {
//   const f = (u.first_name || "").trim();
//   const l = (u.last_name || "").trim();
//   return f || l ? `${f} ${l}`.trim() : u.email || "";
// }

// function parseCSV(v: unknown): string[] {
//   if (!v) return [];
//   if (Array.isArray(v)) return v.flatMap(parseCSV);
//   return String(v)
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// async function getUid(req: Request) {
//   const sb = sbFromReq(req);
//   const { data, error } = await sb.auth.getUser();
//   if (error || !data?.user) return null;
//   return data.user.id;
// }

// async function isAdmin(uid: string) {
//   const admin = supabaseAdmin();
//   const { data } = await admin
//     .from("admins")
//     .select("user_id")
//     .eq("user_id", uid)
//     .maybeSingle();
//   return !!data;
// }

// async function callerLocationIds(uid: string) {
//   const admin = supabaseAdmin();
//   const { data, error } = await admin
//     .from("user_location_roles")
//     .select("location_id")
//     .eq("user_id", uid);
//   if (error) throw error;
//   return Array.from(new Set((data || []).map((r: any) => r.location_id)));
// }

// async function isManagerOf(uid: string, locId: string) {
//   const admin = supabaseAdmin();
//   const { data } = await admin
//     .from("user_location_roles")
//     .select("user_id")
//     .eq("user_id", uid)
//     .eq("location_id", locId)
//     .eq("role_key", "MANAGER")
//     .maybeSingle();
//   return !!data;
// }

// function toBytea(v: any): any {
//   if (v === undefined || v === null || v === "") return null;
//   return Buffer.from(String(v), "utf8");
// }
// function fromBytea(v: any): string | null {
//   if (v === undefined || v === null || v === "") return null;
//   if (typeof v === "string" && v.startsWith("\\x")) {
//     try {
//       return Buffer.from(v.slice(2), "hex").toString("utf8");
//     } catch {
//       return null;
//     }
//   }
//   if (Buffer.isBuffer(v)) return v.toString("utf8");
//   return String(v);
// }
// function safeJson(v: any) {
//   if (v === undefined || v === null || v === "") return null;
//   if (typeof v === "string") {
//     try {
//       return JSON.parse(v);
//     } catch {
//       return null;
//     }
//   }
//   if (typeof v === "object") return v;
//   return null;
// }

// /* ───────────────────────────── list/get ─── */

// export async function listUsers(req: Request, res: Response) {
//   const uid = await getUid(req);
//   if (!uid) return res.status(401).json({ error: "Unauthorized" });

//   const admin = await isAdmin(uid);

//   const q = (req.query.q as string | undefined)?.trim() || "";
//   const roles = parseCSV(req.query.roles);
//   const locFilter = parseCSV(req.query.location_ids);
//   const category = (req.query.category as string | undefined)?.toLowerCase() as
//     | "admins"
//     | "managers"
//     | "staff"
//     | undefined;

//   const sortBy = (req.query.sort_by as string) || "created_at";
//   const sortDir =
//     ((req.query.sort_dir as string) || "desc").toLowerCase() === "asc"
//       ? "asc"
//       : "desc";

//   // Restrict non-admins to their locations
//   let allowedLocIds: string[] | null = null;
//   if (!admin) {
//     allowedLocIds = await callerLocationIds(uid);
//     if (allowedLocIds.length === 0) return res.json([]);
//   }

//   const adminCli = supabaseAdmin();

//   // assignments
//   let assignQ = adminCli
//     .from("user_location_roles")
//     .select("user_id, location_id, role_key, locations(name)")
//     .order("user_id", { ascending: true });

//   if (!admin) assignQ = assignQ.in("location_id", allowedLocIds!);
//   if (locFilter.length) assignQ = assignQ.in("location_id", locFilter);
//   if (roles.length) assignQ = assignQ.in("role_key", roles);

//   const { data: roleRows, error: roleErr } = await assignQ;
//   if (roleErr) return res.status(500).json({ error: roleErr.message });

//   const byUser = new Map<string, Assignment[]>();
//   (roleRows || []).forEach((r: any) => {
//     const arr = byUser.get(r.user_id) || [];
//     arr.push({
//       location_id: r.location_id,
//       location_name: r.locations?.name ?? "",
//       role_key: r.role_key,
//     });
//     byUser.set(r.user_id, arr);
//   });

//   // if filtered or non-admin, narrow profile fetch
//   let restrictUserIds: string[] | null = null;
//   if (!admin || locFilter.length || roles.length) {
//     restrictUserIds = Array.from(byUser.keys());
//     if (restrictUserIds.length === 0) return res.json([]);
//   }

//   // profiles
//   let profQ = adminCli
//     .from("profiles")
//     .select(
//       "user_id, email, first_name, last_name, phone, is_global_admin, created_at"
//     );

//   if (restrictUserIds) profQ = profQ.in("user_id", restrictUserIds);

//   if (sortBy === "email") {
//     profQ = profQ.order("email", {
//       ascending: sortDir === "asc",
//       nullsFirst: true,
//     });
//   } else if (sortBy === "created_at") {
//     profQ = profQ.order("created_at", {
//       ascending: sortDir === "asc",
//       nullsFirst: true,
//     });
//   }

//   const { data: profs, error: profErr } = await profQ;
//   if (profErr) return res.status(500).json({ error: profErr.message });

//   // shape output
//   let out = (profs || []).map((u: UserRow) => {
//     const assigns = byUser.get(u.user_id) || [];
//     return {
//       user_id: u.user_id,
//       full_name: fullName(u),
//       email: u.email || "",
//       phone: u.phone || undefined,
//       is_global_admin: !!u.is_global_admin,
//       created_at: u.created_at || undefined,
//       assignments: assigns,
//     };
//   });

//   if (q) {
//     const ql = q.toLowerCase();
//     out = out.filter(
//       (u) =>
//         u.full_name.toLowerCase().includes(ql) ||
//         u.email.toLowerCase().includes(ql)
//     );
//   }

//   if (category) {
//     out = out.filter((u) => {
//       const hasManager = u.assignments.some((a) => a.role_key === "MANAGER");
//       if (category === "admins") return u.is_global_admin;
//       if (category === "managers") return hasManager;
//       if (category === "staff") return !u.is_global_admin;
//       return true;
//     });
//   }

//   if (sortBy === "name") {
//     out.sort((a, b) =>
//       sortDir === "asc"
//         ? a.full_name.localeCompare(b.full_name)
//         : b.full_name.localeCompare(a.full_name)
//     );
//   }

//   res.json(out);
// }

// export async function getUser(req: Request, res: Response) {
//   const uid = await getUid(req);
//   if (!uid) return res.status(401).json({ error: "Unauthorized" });

//   const adminCli = supabaseAdmin();
//   const { data: u, error } = await adminCli
//     .from("profiles")
//     .select(
//       `
//       user_id,
//       email,
//       first_name,
//       last_name,
//       phone,
//       is_global_admin,
//       date_of_birth,
//       gender,
//       avatar_url,
//       address_json,
//       emergency_contact_json
//     `
//     )
//     .eq("user_id", req.params.id)
//     .maybeSingle();
//   if (error) return res.status(500).json({ error: error.message });
//   if (!u) return res.status(404).json({ error: "Not found" });

//   const { data: roles, error: rErr } = await adminCli
//     .from("user_location_roles")
//     .select("location_id, role_key, locations(name)")
//     .eq("user_id", req.params.id);
//   if (rErr) return res.status(500).json({ error: rErr.message });

//   res.json({
//     user_id: u.user_id,
//     full_name: fullName(u),
//     email: u.email || "",
//     phone: u.phone || undefined,
//     is_global_admin: !!u.is_global_admin,
//     // expose extended personal fields so UI can rehydrate
//     first_name: u.first_name ?? null,
//     last_name: u.last_name ?? null,
//     date_of_birth: u.date_of_birth ?? null,
//     gender: u.gender ?? null,
//     avatar_url: u.avatar_url ?? null,
//     address_json: u.address_json ?? null,
//     emergency_contact_json: u.emergency_contact_json ?? null,
//     assignments: (roles || []).map((r: any) => ({
//       location_id: r.location_id,
//       location_name: r.locations?.name ?? "",
//       role_key: r.role_key,
//     })),
//   });
// }

// /* ─────────────────────── create (attach or new) + employment ─── */

// export async function createUser(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });

//   const adminCli = supabaseAdmin();

//   // Preferred body shape with optional per-location employment (now includes pay_rate)
//   const {
//     email,
//     password,
//     first_name,
//     last_name,
//     phone,
//     assignments: rawAssigns,
//     location_id,
//     role_key,
//   } = req.body || {};

//   let assignments: Array<{
//     location_id: string;
//     role_key: string;
//     employment?: {
//       position_title?: string | null;
//       employment_type?: string | null;
//       hire_date?: string | null;
//       termination_date?: string | null;
//       manager_user_id?: string | null;
//       pay_rate?: string | null;
//       pay_currency?: string | null;
//       scheduling_preferences?: any;
//     };
//   }> = Array.isArray(rawAssigns) ? rawAssigns : [];

//   if (!assignments.length && location_id && role_key) {
//     assignments = [{ location_id, role_key }];
//   }

//   if (!email || assignments.length === 0) {
//     return res
//       .status(400)
//       .json({ error: "email and at least one assignment are required" });
//   }

//   // Only admin or manager of EACH target location
//   const admin = await isAdmin(caller);
//   if (!admin) {
//     for (const a of assignments) {
//       const allowed = await isManagerOf(caller, a.location_id);
//       if (!allowed)
//         return res
//           .status(403)
//           .json({ error: "Forbidden: invalid location for manager" });
//     }
//   }

//   // 1) find or create user
//   const { data: existing } = await adminCli
//     .from("profiles")
//     .select("user_id")
//     .eq("email", email)
//     .maybeSingle();

//   let userId: string;
//   let status: "created" | "attached" = "attached";

//   if (!existing) {
//     // No date fields required; if password omitted, generate one.
//     const { data: authRes, error: auErr } =
//       await adminCli.auth.admin.createUser({
//         email,
//         password: password || randomUUID(),
//         email_confirm: true,
//         user_metadata: { first_name, last_name, phone },
//       });
//     if (auErr || !authRes?.user)
//       return res
//         .status(400)
//         .json({ error: auErr?.message || "Auth create failed" });

//     userId = authRes.user.id;
//     status = "created";

//     const { error: pfErr } = await adminCli.from("profiles").upsert(
//       {
//         user_id: userId,
//         email,
//         first_name: first_name ?? null,
//         last_name: last_name ?? null,
//         phone: phone ?? null,
//         is_global_admin: false,
//       },
//       { onConflict: "user_id" }
//     );
//     if (pfErr) return res.status(500).json({ error: pfErr.message });
//   } else {
//     userId = existing.user_id;
//     // Optionally update profile if extra personal fields provided
//     if (first_name || last_name || phone) {
//       await adminCli
//         .from("profiles")
//         .update({
//           first_name: first_name ?? undefined,
//           last_name: last_name ?? undefined,
//           phone: phone ?? undefined,
//         })
//         .eq("user_id", userId);
//     }
//   }

//   // 2) upsert assignments (multi) + optional per-location employment
//   for (const a of assignments) {
//     const { error: rlErr } = await adminCli
//       .from("user_location_roles")
//       .upsert(
//         { user_id: userId, location_id: a.location_id, role_key: a.role_key },
//         { onConflict: "user_id,location_id" }
//       );
//     if (rlErr) return res.status(500).json({ error: rlErr.message });

//     if (a.employment) {
//       const {
//         position_title,
//         employment_type,
//         hire_date,
//         termination_date,
//         manager_user_id,
//         pay_rate,
//         pay_currency,
//         scheduling_preferences,
//       } = a.employment;

//       const { error: empErr } = await adminCli.from("user_employment").upsert(
//         {
//           user_id: userId,
//           location_id: a.location_id,
//           position_title: position_title ?? null,
//           employment_type: employment_type ?? null,
//           hire_date: hire_date ?? null,
//           termination_date: termination_date ?? null,
//           manager_user_id: manager_user_id ?? null,
//           pay_rate_enc: toBytea(pay_rate),
//           pay_currency: pay_currency ?? null,
//           scheduling_preferences:
//             scheduling_preferences === undefined
//               ? null
//               : scheduling_preferences,
//         },
//         { onConflict: "user_id,location_id" }
//       );
//       if (empErr) return res.status(500).json({ error: empErr.message });
//     }
//   }

//   res
//     .status(201)
//     .json({ user_id: userId, status, assignments: assignments.length });
// }

// /* ───────────────────────── personal profile update ─── */

// export async function updateUser(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });

//   // Optional, non-required personal fields (email purposely excluded)
//   const {
//     first_name,
//     last_name,
//     phone,
//     date_of_birth,
//     gender,
//     avatar_url,
//     address_json,
//     emergency_contact_json,
//   } = req.body || {};

//   const adminCli = supabaseAdmin();
//   const patch: Record<string, any> = {};
//   if (first_name !== undefined) patch.first_name = first_name;
//   if (last_name !== undefined) patch.last_name = last_name;
//   if (phone !== undefined) patch.phone = phone;
//   if (date_of_birth !== undefined) patch.date_of_birth = date_of_birth;
//   if (gender !== undefined) patch.gender = gender;
//   if (avatar_url !== undefined) patch.avatar_url = avatar_url;
//   if (address_json !== undefined) patch.address_json = address_json;
//   if (emergency_contact_json !== undefined)
//     patch.emergency_contact_json = emergency_contact_json;

//   const { error } = await adminCli
//     .from("profiles")
//     .update(patch)
//     .eq("user_id", req.params.id);

//   if (error) return res.status(500).json({ error: error.message });
//   res.json({ ok: true });
// }

// /* ─────────────── employment read + upsert (per location) ─── */

// /** GET /v1/users/:id/employment?location_id=...
//  *  Admins: any location
//  *  Managers: only locations they manage
//  */
// export async function getEmployment(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });
//   const admin = await isAdmin(caller);

//   const userId = req.params.id;
//   const locationId = (req.query.location_id as string | undefined) || null;

//   const adminCli = supabaseAdmin();

//   if (locationId && !admin) {
//     const allowed = await isManagerOf(caller, locationId);
//     if (!allowed) return res.status(403).json({ error: "Forbidden" });
//   }

//   let q = adminCli
//     .from("user_employment")
//     .select(
//       `
//       user_id,
//       location_id,
//       position_title,
//       employment_type,
//       hire_date,
//       termination_date,
//       manager_user_id,
//       pay_rate_enc,
//       pay_currency,
//       scheduling_preferences,
//       locations(name)
//     `
//     )
//     .eq("user_id", userId);

//   if (locationId) q = q.eq("location_id", locationId);

//   const { data, error } = await q;
//   if (error) return res.status(500).json({ error: error.message });

//   const rows =
//     data?.map((r: any) => ({
//       user_id: r.user_id,
//       location_id: r.location_id,
//       position_title: r.position_title,
//       employment_type: r.employment_type,
//       hire_date: r.hire_date,
//       termination_date: r.termination_date,
//       manager_user_id: r.manager_user_id,
//       pay_rate: fromBytea(r.pay_rate_enc), // decoded for UI
//       pay_currency: r.pay_currency,
//       scheduling_preferences: r.scheduling_preferences,
//       location_name: r.locations?.name ?? "",
//     })) ?? [];

//   res.json(rows);
// }

// /** PUT /v1/users/:id/employment
//  *  body: { location_id, position_title?, employment_type?, hire_date?, termination_date?, manager_user_id?, pay_rate?, pay_currency?, scheduling_preferences? }
//  *
//  *  Admins: any location
//  *  Managers: only locations they manage; cannot edit their own employment
//  */
// export async function upsertEmployment(req: Request, res: Response) {
//   const caller = await getUid(req);
//   if (!caller) return res.status(401).json({ error: "Unauthorized" });

//   const admin = await isAdmin(caller);
//   const {
//     location_id,
//     position_title,
//     employment_type,
//     hire_date,
//     termination_date,
//     manager_user_id,
//     pay_rate,
//     pay_currency,
//     scheduling_preferences,
//   } = req.body || {};

//   if (!location_id)
//     return res.status(400).json({ error: "location_id is required" });

//   // managers: restricted to their locations + cannot edit their own employment
//   if (!admin) {
//     const allowed = await isManagerOf(caller, location_id);
//     if (!allowed) return res.status(403).json({ error: "Forbidden" });
//     if (caller === req.params.id)
//       return res
//         .status(403)
//         .json({ error: "Managers cannot edit their own employment" });
//   }

//   const adminCli = supabaseAdmin();
//   const { error } = await adminCli.from("user_employment").upsert(
//     {
//       user_id: req.params.id,
//       location_id,
//       position_title: position_title ?? null,
//       employment_type: employment_type ?? null,
//       hire_date: hire_date ?? null,
//       termination_date: termination_date ?? null,
//       manager_user_id: manager_user_id ?? (admin ? caller : undefined) ?? null,
//       pay_rate_enc: toBytea(pay_rate),
//       pay_currency: pay_currency ?? null,
//       scheduling_preferences: safeJson(scheduling_preferences),
//       updated_at: new Date().toISOString(),
//     },
//     { onConflict: "user_id,location_id" }
//   );
//   if (error) return res.status(500).json({ error: error.message });
//   res.json({ ok: true });
// }

// server/controllers/users.ts
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { sbFromReq } from "../middleware/auth";
import { supabaseAdmin } from "../supabase";

/* ───────────────────────────── types/helpers ─── */

type Assignment = {
  location_id: string;
  location_name: string;
  role_key: string;
};
type UserRow = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  is_global_admin: boolean | null;
  created_at?: string | null;
};

function fullName(u: UserRow) {
  const f = (u.first_name || "").trim();
  const l = (u.last_name || "").trim();
  return f || l ? `${f} ${l}`.trim() : u.email || "";
}

function parseCSV(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.flatMap(parseCSV);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getUid(req: Request) {
  const sb = sbFromReq(req);
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
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

async function callerLocationIds(uid: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("user_location_roles")
    .select("location_id")
    .eq("user_id", uid);
  if (error) throw error;
  return Array.from(new Set((data || []).map((r: any) => r.location_id)));
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

function toBytea(v: any): any {
  if (v === undefined || v === null || v === "") return null;
  return Buffer.from(String(v), "utf8");
}
// function fromBytea(v: any): string | null {
//   if (v === undefined || v === null || v === "") return null;
//   if (typeof v === "string" && v.startsWith("\\x")) {
//     try {
//       return Buffer.from(v.slice(2), "hex").toString("utf8");
//     } catch {
//       return null;
//     }
//   }
//   if (Buffer.isBuffer(v)) return v.toString("utf8");
//   return String(v);
// }

function fromBytea(v: any): string | null {
  if (v === undefined || v === null || v === "") return null;

  // Supabase often returns bytea as '\x..' hex string
  let s: string | null = null;
  if (typeof v === "string") {
    if (v.startsWith("\\x")) {
      try {
        s = Buffer.from(v.slice(2), "hex").toString("utf8");
      } catch {
        s = null;
      }
    } else {
      // Sometimes the DB already holds a plain UTF‑8 string
      s = v;
    }
  } else if (Buffer.isBuffer(v)) {
    s = v.toString("utf8");
  } else {
    s = String(v);
  }

  if (s == null || s === "") return null;

  // If what we decoded is a JSON-serialized Node Buffer, unwrap it.
  // Example: {"type":"Buffer","data":[49,56]}  -> "18"
  try {
    const j = JSON.parse(s);
    if (j && j.type === "Buffer" && Array.isArray(j.data)) {
      s = Buffer.from(j.data).toString("utf8");
    }
  } catch {
    /* not JSON — ignore */
  }

  return s;
}
function safeJson(v: any) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (typeof v === "object") return v;
  return null;
}

/* ───────────────────────────── list/get ─── */

export async function listUsers(req: Request, res: Response) {
  const uid = await getUid(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const admin = await isAdmin(uid);

  const q = (req.query.q as string | undefined)?.trim() || "";
  const roles = parseCSV(req.query.roles);
  const locFilter = parseCSV(req.query.location_ids);
  const category = (req.query.category as string | undefined)?.toLowerCase() as
    | "admins"
    | "managers"
    | "staff"
    | undefined;

  const sortBy = (req.query.sort_by as string) || "created_at";
  const sortDir =
    ((req.query.sort_dir as string) || "desc").toLowerCase() === "asc"
      ? "asc"
      : "desc";

  // Restrict non-admins to their locations
  let allowedLocIds: string[] | null = null;
  if (!admin) {
    allowedLocIds = await callerLocationIds(uid);
    if (allowedLocIds.length === 0) return res.json([]);
  }

  const adminCli = supabaseAdmin();

  // assignments
  let assignQ = adminCli
    .from("user_location_roles")
    .select("user_id, location_id, role_key, locations(name)")
    .order("user_id", { ascending: true });

  if (!admin) assignQ = assignQ.in("location_id", allowedLocIds!);
  if (locFilter.length) assignQ = assignQ.in("location_id", locFilter);
  if (roles.length) assignQ = assignQ.in("role_key", roles);

  const { data: roleRows, error: roleErr } = await assignQ;
  if (roleErr) return res.status(500).json({ error: roleErr.message });

  const byUser = new Map<string, Assignment[]>();
  (roleRows || []).forEach((r: any) => {
    const arr = byUser.get(r.user_id) || [];
    arr.push({
      location_id: r.location_id,
      location_name: r.locations?.name ?? "",
      role_key: r.role_key,
    });
    byUser.set(r.user_id, arr);
  });

  // if filtered or non-admin, narrow profile fetch
  let restrictUserIds: string[] | null = null;
  if (!admin || locFilter.length || roles.length) {
    restrictUserIds = Array.from(byUser.keys());
    if (restrictUserIds.length === 0) return res.json([]);
  }

  // profiles
  let profQ = adminCli
    .from("profiles")
    .select(
      "user_id, email, first_name, last_name, phone, is_global_admin, created_at"
    );

  if (restrictUserIds) profQ = profQ.in("user_id", restrictUserIds);

  if (sortBy === "email") {
    profQ = profQ.order("email", {
      ascending: sortDir === "asc",
      nullsFirst: true,
    });
  } else if (sortBy === "created_at") {
    profQ = profQ.order("created_at", {
      ascending: sortDir === "asc",
      nullsFirst: true,
    });
  }

  const { data: profs, error: profErr } = await profQ;
  if (profErr) return res.status(500).json({ error: profErr.message });

  // shape output
  let out = (profs || []).map((u: UserRow) => {
    const assigns = byUser.get(u.user_id) || [];
    return {
      user_id: u.user_id,
      full_name: fullName(u),
      email: u.email || "",
      phone: u.phone || undefined,
      is_global_admin: !!u.is_global_admin,
      created_at: u.created_at || undefined,
      assignments: assigns,
    };
  });

  if (q) {
    const ql = q.toLowerCase();
    out = out.filter(
      (u) =>
        u.full_name.toLowerCase().includes(ql) ||
        u.email.toLowerCase().includes(ql)
    );
  }

  if (category) {
    out = out.filter((u) => {
      const hasManager = u.assignments.some((a) => a.role_key === "MANAGER");
      if (category === "admins") return u.is_global_admin;
      if (category === "managers") return hasManager;
      if (category === "staff") return !u.is_global_admin;
      return true;
    });
  }

  if (sortBy === "name") {
    out.sort((a, b) =>
      sortDir === "asc"
        ? a.full_name.localeCompare(b.full_name)
        : b.full_name.localeCompare(a.full_name)
    );
  }

  res.json(out);
}

export async function getUser(req: Request, res: Response) {
  const uid = await getUid(req);
  const targetId = String(req.params.id);

  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const adminCli = supabaseAdmin();

  // 1) profile
  const { data: p, error: pe } = await adminCli
    .from("profiles")
    .select(
      `
      user_id,
      email,
      first_name,
      last_name,
      phone,
      is_global_admin,
      date_of_birth,
      gender,
      avatar_url,
      address_json,
      emergency_contact_json,
      created_at,
      updated_at
    `
    )
    .eq("user_id", targetId)
    .maybeSingle();

  if (pe) return res.status(500).json({ error: pe.message });
  if (!p) return res.status(404).json({ error: "Not found" });

  // 2) role assignments (+ location names)
  const { data: roles, error: re } = await adminCli
    .from("user_location_roles")
    .select("location_id, role_key, locations(name)")
    .eq("user_id", targetId);

  if (re) return res.status(500).json({ error: re.message });

  const assignments =
    (roles || []).map((r: any) => ({
      location_id: r.location_id,
      role_key: r.role_key,
      location_name: r.locations?.name ?? "",
    })) ?? [];

  // 3) response (full payload so the UI can hydrate the edit modal)
  res.json({
    user_id: p.user_id,
    full_name:
      (p.first_name || "").trim() || (p.last_name || "").trim()
        ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
        : p.email || "",
    email: p.email || "",
    phone: p.phone || undefined,
    is_global_admin: !!p.is_global_admin,

    // extended personal fields
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    date_of_birth: p.date_of_birth ?? null,
    gender: p.gender ?? null,
    avatar_url: p.avatar_url ?? null,
    address_json: p.address_json ?? null,
    emergency_contact_json: p.emergency_contact_json ?? null,

    created_at: p.created_at || null,
    updated_at: p.updated_at || null,

    assignments,
  });
}

/* ─────────────────────── create (attach or new) + employment ─── */

export async function createUser(req: Request, res: Response) {
  const caller = await getUid(req);
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  const adminCli = supabaseAdmin();

  // Preferred body shape with optional per-location employment (now includes pay_rate)
  const {
    email,
    password,
    first_name,
    last_name,
    phone,
    assignments: rawAssigns,
    location_id,
    role_key,
  } = req.body || {};

  let assignments: Array<{
    location_id: string;
    role_key: string;
    employment?: {
      position_title?: string | null;
      employment_type?: string | null;
      hire_date?: string | null;
      termination_date?: string | null;
      manager_user_id?: string | null;
      pay_rate?: string | null;
      pay_currency?: string | null;
      scheduling_preferences?: any;
    };
  }> = Array.isArray(rawAssigns) ? rawAssigns : [];

  if (!assignments.length && location_id && role_key) {
    assignments = [{ location_id, role_key }];
  }

  if (!email || assignments.length === 0) {
    return res
      .status(400)
      .json({ error: "email and at least one assignment are required" });
  }

  // Only admin or manager of EACH target location
  const admin = await isAdmin(caller);
  if (!admin) {
    for (const a of assignments) {
      const allowed = await isManagerOf(caller, a.location_id);
      if (!allowed)
        return res
          .status(403)
          .json({ error: "Forbidden: invalid location for manager" });
    }
  }

  // 1) find or create user
  const { data: existing } = await adminCli
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  let userId: string;
  let status: "created" | "attached" = "attached";

  if (!existing) {
    const { data: authRes, error: auErr } =
      await adminCli.auth.admin.createUser({
        email,
        password: password || randomUUID(),
        email_confirm: true,
        user_metadata: { first_name, last_name, phone },
      });
    if (auErr || !authRes?.user)
      return res
        .status(400)
        .json({ error: auErr?.message || "Auth create failed" });

    userId = authRes.user.id;
    status = "created";

    const { error: pfErr } = await adminCli.from("profiles").upsert(
      {
        user_id: userId,
        email,
        first_name: first_name ?? null,
        last_name: last_name ?? null,
        phone: phone ?? null,
        is_global_admin: false,
      },
      { onConflict: "user_id" }
    );
    if (pfErr) return res.status(500).json({ error: pfErr.message });
  } else {
    userId = existing.user_id;
    if (first_name || last_name || phone) {
      await adminCli
        .from("profiles")
        .update({
          first_name: first_name ?? undefined,
          last_name: last_name ?? undefined,
          phone: phone ?? undefined,
        })
        .eq("user_id", userId);
    }
  }

  // 2) upsert assignments (multi) + optional per-location employment
  for (const a of assignments) {
    const { error: rlErr } = await adminCli
      .from("user_location_roles")
      .upsert(
        { user_id: userId, location_id: a.location_id, role_key: a.role_key },
        { onConflict: "user_id,location_id" }
      );
    if (rlErr) return res.status(500).json({ error: rlErr.message });

    if (a.employment) {
      const {
        position_title,
        employment_type,
        hire_date,
        termination_date,
        manager_user_id,
        pay_rate,
        pay_currency,
        scheduling_preferences,
      } = a.employment;

      const { error: empErr } = await adminCli.from("user_employment").upsert(
        {
          user_id: userId,
          location_id: a.location_id,
          position_title: position_title ?? null,
          employment_type: employment_type ?? null,
          hire_date: hire_date ?? null,
          termination_date: termination_date ?? null,
          manager_user_id: manager_user_id ?? null,
          pay_rate_enc: toBytea(pay_rate),
          pay_currency: pay_currency ?? null,
          scheduling_preferences:
            scheduling_preferences === undefined
              ? null
              : scheduling_preferences,
        },
        { onConflict: "user_id,location_id" }
      );
      if (empErr) return res.status(500).json({ error: empErr.message });
    }
  }

  res
    .status(201)
    .json({ user_id: userId, status, assignments: assignments.length });
}

/* ───────────────────────── personal profile update ─── */

export async function updateUser(req: Request, res: Response) {
  const caller = await getUid(req);
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  // Optional, non-required personal fields (email purposely excluded)
  const {
    first_name,
    last_name,
    phone,
    date_of_birth,
    gender,
    avatar_url,
    address_json,
    emergency_contact_json,
  } = req.body || {};

  const adminCli = supabaseAdmin();
  const patch: Record<string, any> = {};
  if (first_name !== undefined) patch.first_name = first_name;
  if (last_name !== undefined) patch.last_name = last_name;
  if (phone !== undefined) patch.phone = phone;
  if (date_of_birth !== undefined) patch.date_of_birth = date_of_birth;
  if (gender !== undefined) patch.gender = gender;
  if (avatar_url !== undefined) patch.avatar_url = avatar_url;
  if (address_json !== undefined) patch.address_json = address_json;
  if (emergency_contact_json !== undefined)
    patch.emergency_contact_json = emergency_contact_json;

  const { error } = await adminCli
    .from("profiles")
    .update(patch)
    .eq("user_id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}

/* ─────────────── employment read + upsert (per location) ─── */

export async function getEmployment(req: Request, res: Response) {
  const caller = await getUid(req);
  if (!caller) return res.status(401).json({ error: "Unauthorized" });
  const admin = await isAdmin(caller);

  const userId = req.params.id;
  const locationId = (req.query.location_id as string | undefined) || null;

  const adminCli = supabaseAdmin();

  if (locationId && !admin) {
    const allowed = await isManagerOf(caller, locationId);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
  }

  let q = adminCli
    .from("user_employment")
    .select(
      `
      user_id,
      location_id,
      position_title,
      employment_type,
      hire_date,
      termination_date,
      manager_user_id,
      pay_rate_enc,
      pay_currency,
      scheduling_preferences,
      locations(name)
    `
    )
    .eq("user_id", userId);

  if (locationId) q = q.eq("location_id", locationId);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  const rows =
    data?.map((r: any) => ({
      user_id: r.user_id,
      location_id: r.location_id,
      position_title: r.position_title,
      employment_type: r.employment_type,
      hire_date: r.hire_date,
      termination_date: r.termination_date,
      manager_user_id: r.manager_user_id,
      pay_rate: fromBytea(r.pay_rate_enc), // decoded for UI
      pay_currency: r.pay_currency,
      scheduling_preferences: r.scheduling_preferences,
      location_name: r.locations?.name ?? "",
    })) ?? [];

  res.json(rows);
}

export async function upsertEmployment(req: Request, res: Response) {
  const caller = await getUid(req);
  if (!caller) return res.status(401).json({ error: "Unauthorized" });

  const admin = await isAdmin(caller);
  const {
    location_id,
    position_title,
    employment_type,
    hire_date,
    termination_date,
    manager_user_id,
    pay_rate,
    pay_currency,
    scheduling_preferences,
  } = req.body || {};

  if (!location_id)
    return res.status(400).json({ error: "location_id is required" });

  if (!admin) {
    const allowed = await isManagerOf(caller, location_id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    if (caller === req.params.id)
      return res
        .status(403)
        .json({ error: "Managers cannot edit their own employment" });
  }

  const adminCli = supabaseAdmin();
  const { error } = await adminCli.from("user_employment").upsert(
    {
      user_id: req.params.id,
      location_id,
      position_title: position_title ?? null,
      employment_type: employment_type ?? null,
      hire_date: hire_date ?? null,
      termination_date: termination_date ?? null,
      manager_user_id: manager_user_id ?? (admin ? caller : undefined) ?? null,
      pay_rate_enc: toBytea(pay_rate),
      pay_currency: pay_currency ?? null,
      scheduling_preferences: safeJson(scheduling_preferences),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,location_id" }
  );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}
