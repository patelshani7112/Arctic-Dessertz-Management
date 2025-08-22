// apps/server/src/routes/my.routes.ts
import { Router } from "express";
import { listMyLocations } from "../controllers/myController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();
r.get("/v1/my/locations", asyncHandler(listMyLocations));
export default r;
