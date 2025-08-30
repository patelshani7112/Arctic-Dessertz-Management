// server/routes/index.ts
import { Router } from "express";

import health from "./health.routes";
import me from "./me.routes";
import my from "./my.routes";
import locations from "./locations.routes";
import roles from "./roles.routes";
import userLocationRoles from "./userLocationRoles.routes";
import users from "./users.routes";
import auth from "./auth.routes";
import inventory from "./inventory.routes";

const api = Router();

api.get("/v1/_ping", (_req, res) => res.json({ ok: true, scope: "root-router" }));

// v1 grouping of routes
api.use(health);
api.use(me);
api.use(my);
api.use(locations);
api.use(roles);
api.use(userLocationRoles);
api.use(users);
api.use(auth);
api.use(inventory); // mounts all /v1/inventory endpoints

export default api;
