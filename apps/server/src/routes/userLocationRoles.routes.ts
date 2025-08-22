import { Router } from "express";
import { listUserLocationRoles } from "../controllers/userLocationRolesController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();
r.get("/v1/user-location-roles", asyncHandler(listUserLocationRoles));
export default r;
