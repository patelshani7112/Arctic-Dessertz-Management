import { Router } from "express";
import { health } from "../controllers/healthController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();
r.get("/health", asyncHandler(health as any));
export default r;
