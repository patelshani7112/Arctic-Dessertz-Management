import { Router } from "express";
import { getMe } from "../controllers/meController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();
r.get("/v1/me", asyncHandler(getMe));
export default r;
