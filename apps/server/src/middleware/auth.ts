import type { Request } from "express";
import { supabaseForToken } from "../supabase";

export function getToken(req: Request) {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
}

export function sbFromReq(req: Request) {
  return supabaseForToken(getToken(req));
}
