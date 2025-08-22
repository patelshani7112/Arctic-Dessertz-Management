// server/controllers/authController.ts
import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { sbFromReq } from "../middleware/auth";
import { supabaseAdmin } from "../supabase";

/**
 * We use a lightweight anon client for user-initiated auth actions
 * (sign-in with password / send recovery email). Admin client remains
 * for privileged ops if ever needed.
 */
function supabaseAnon() {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false },
  });
}

/** POST /v1/auth/login  { email, password } */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const sb = supabaseAnon();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  // Return minimal session data for your SPA to store if you want,
  // most apps just log in on the client. This keeps parity with your API style.
  return res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    },
  });
}

/** POST /v1/auth/logout  (uses the bearer token/cookies on the request) */
export async function logout(req: Request, res: Response) {
  const sb = sbFromReq(req);
  const { error } = await sb.auth.signOut();
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true });
}

/**
 * POST /v1/auth/forgot-password { email }
 * Sends Supabase’s built-in password recovery email.
 * After the user clicks the email link, Supabase will create
 * a "recovery" session in your front-end app at redirectTo,
 * where you can collect the new password and call updateUser.
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });

  const redirectTo =
    process.env.RESET_REDIRECT_URL ||
    // fallback to your web app route
    "http://localhost:5173/reset-password";

  const sb = supabaseAnon();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ ok: true });
}

/**
 * (Optional) Admin reset (not used by end-users)
 * POST /v1/auth/admin-reset { user_id, new_password }
 * Only keep if you later want an admin-only tool.
 */
export async function adminResetPassword(req: Request, res: Response) {
  const { user_id, new_password } = req.body || {};
  if (!user_id || !new_password)
    return res
      .status(400)
      .json({ error: "user_id and new_password are required" });

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.updateUserById(user_id, {
    password: new_password,
  });
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ ok: true, user_id: data.user?.id });
}
