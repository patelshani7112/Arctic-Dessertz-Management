// server/routes/index.ts
import { Router } from "express";
import health from "./health.routes";
import me from "./me.routes";
import my from "./my.routes";
import locations from "./locations.routes";
import roles from "./roles.routes";
import userLocationRoles from "./userLocationRoles.routes";
import users from "./users.routes";
import auth from "./auth.routes"; // ← add

const api = Router();
api.use(health);
api.use(me);
api.use(my);
api.use(locations);
api.use(roles);
api.use(userLocationRoles);
api.use(users);
api.use(auth); // ← add

export default api;
