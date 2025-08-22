import { Router } from "express";
import {
  assignLocationRole,
  removeLocationRole,
  setGlobalAdmin,
  listRoleOptions,
} from "../controllers/rolesController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();
r.get("/v1/roles", asyncHandler(listRoleOptions));
r.post("/v1/roles/location", asyncHandler(assignLocationRole));
r.delete("/v1/roles/location", asyncHandler(removeLocationRole));
r.post("/v1/roles/global-admin", asyncHandler(setGlobalAdmin));
export default r;
