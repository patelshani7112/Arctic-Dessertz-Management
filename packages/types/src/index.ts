import { z } from "zod";

export const RoleEnum = z.enum([
  "MANAGER",
  "VIEW_ONLY",
  "CASHIER",
  "DISHWASHER",
  "COOK",
  "SERVER"
]);
export type Role = z.infer<typeof RoleEnum>;

export const LocationCreateSchema = z.object({
  name: z.string().min(2),
  tz: z.string().min(2),
  address_json: z.record(z.any()).default({}),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional()
});
export type LocationCreate = z.infer<typeof LocationCreateSchema>;

export const AssignRoleSchema = z.object({
  target_user_id: z.string().uuid(),
  location_id: z.string().uuid(),
  new_role: RoleEnum,
  reason: z.string().optional()
});
export type AssignRole = z.infer<typeof AssignRoleSchema>;