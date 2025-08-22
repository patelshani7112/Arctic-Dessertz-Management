import { Router } from "express";
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/locationsController";
import { asyncHandler } from "../utils/asyncHandler";

const r = Router();
r.get("/v1/locations", asyncHandler(listLocations));
r.get("/v1/locations/:id", asyncHandler(getLocation));
r.post("/v1/locations", asyncHandler(createLocation));
r.patch("/v1/locations/:id", asyncHandler(updateLocation));
r.delete("/v1/locations/:id", asyncHandler(deleteLocation));
export default r;
