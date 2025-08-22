import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  getEmployment,
  upsertEmployment,
} from "../controllers/usersController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();

r.get("/v1/users", asyncHandler(listUsers));
r.get("/v1/users/:id", asyncHandler(getUser));
r.post("/v1/users", asyncHandler(createUser));
r.patch("/v1/users/:id", asyncHandler(updateUser));

/** Professional (per-location) endpoints */
r.get("/v1/users/:id/employment", asyncHandler(getEmployment));
r.put("/v1/users/:id/employment", asyncHandler(upsertEmployment));

export default r;
