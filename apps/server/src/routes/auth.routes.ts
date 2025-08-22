// server/routes/auth.routes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  login,
  logout,
  forgotPassword,
  adminResetPassword,
} from "../controllers/authController";

const r = Router();

r.post("/v1/auth/login", asyncHandler(login));
r.post("/v1/auth/logout", asyncHandler(logout));
r.post("/v1/auth/forgot-password", asyncHandler(forgotPassword));

// optional admin helper (comment out if not needed yet)
// r.post("/v1/auth/admin-reset", asyncHandler(adminResetPassword));

export default r;
