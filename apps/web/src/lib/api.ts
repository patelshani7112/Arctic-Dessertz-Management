// apps/web/src/lib/api.ts
import { supabase } from "./supabase";

/** Base URL for your API (e.g. http://localhost:4000) */
const API = import.meta.env.VITE_API_BASE as string;
if (!API) throw new Error("VITE_API_BASE is not set in your .env");

/** Low-level request helper with Supabase JWT attached */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const ct = res.headers.get("content-type") || "";

  let payload: any = undefined;
  try {
    if (res.status !== 204) {
      if (ct.includes("application/json")) payload = await res.json();
      else {
        const txt = await res.text();
        payload = txt ? JSON.parse(txt) : undefined;
      }
    }
  } catch {
    // ignore parse errors; keep payload undefined
  }

  if (!res.ok) {
    const msg =
      (typeof payload === "object" && payload?.error) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return (payload ?? (undefined as unknown)) as T;
}

/** Convenience wrappers */
export const apiGet = <T>(p: string) => request<T>(p);
export const apiPost = <T>(p: string, body?: any) =>
  request<T>(p, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
export const apiPatch = <T>(p: string, body?: any) =>
  request<T>(p, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
export const apiPut = <T>(p: string, body?: any) =>
  request<T>(p, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
export const apiDelete = <T = void>(p: string) =>
  request<T>(p, { method: "DELETE" });
export const apiDeleteJson = <T = void>(p: string, body?: any) =>
  request<T>(p, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
  });

/* ===========================
   Types
   =========================== */

export type ProfileMe = {
  user_id: string;
  full_name: string;
  email: string;
  is_global_admin: boolean;
};

export type RoleKey =
  | "VIEW_ONLY"
  | "CASHIER"
  | "DISHWASHER"
  | "COOK"
  | "SERVER"
  | "MANAGER";

export type Location = {
  id: string;
  name: string;
  brand_name?: string | null;
  tz: string;
  address_json?: any;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  open_hours_json?: any;
  geofence_meters?: number | null;
  printer_config_json?: any;
  pos_external_id?: string | null;
  is_active?: boolean | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  my_role?: RoleKey;
};

export type Assignment = {
  location_id: string;
  location_name: string;
  role_key: RoleKey;
};

export type UserWithAssignments = {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  is_global_admin: boolean;
  assignments: Assignment[];
};

export type ListUsersOptions = {
  q?: string;
  roles?: RoleKey[];
  location_ids?: string[];
  category?: "admins" | "managers" | "staff";
  sort_by?: "name" | "email" | "created_at";
  sort_dir?: "asc" | "desc";
};

export type EmploymentRecord = {
  user_id: string;
  location_id: string;
  location_name?: string;
  position_title?: string | null;
  employment_type?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  manager_user_id?: string | null;
  pay_rate?: string | null;
  pay_currency?: string | null;
  scheduling_preferences?: any;
};

export type EmploymentUpsert = {
  position_title?: string | null;
  employment_type?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  manager_user_id?: string | null;
  pay_rate?: string | null;
  pay_currency?: string | null;
  scheduling_preferences?: any;
};

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
    } else if (String(v).length) {
      sp.set(k, String(v));
    }
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ===========================
   API surfaces
   =========================== */

export const Me = { get: () => apiGet<ProfileMe>("/v1/me") };

export const My = { locations: () => apiGet<Location[]>("/v1/my/locations") };

export const Locations = {
  list: () => apiGet<Location[]>("/v1/locations"),
  get: (id: string) => apiGet<Location>(`/v1/locations/${id}`),
  create: (payload: Partial<Location> & { name: string; tz: string }) =>
    apiPost<{ id: string }>("/v1/locations", payload),
  update: (id: string, patch: Partial<Location>) =>
    apiPatch<{ ok: true }>(`/v1/locations/${id}`, patch),
  delete: (id: string) => apiDelete(`/v1/locations/${id}`),
};

export const UsersAPI = {
  list: (opts?: ListUsersOptions) =>
    apiGet<UserWithAssignments[]>(`/v1/users${qs(opts || {})}`),

  // includes assignments + extended personal fields
  get: (id: string) =>
    apiGet<
      UserWithAssignments & {
        first_name?: string | null;
        last_name?: string | null;
        date_of_birth?: string | null;
        gender?: string | null;
        avatar_url?: string | null;
        address_json?: any;
        emergency_contact_json?: any;
        created_at?: string | null;
        updated_at?: string | null;
      }
    >(`/v1/users/${id}`),

  create: (payload: {
    email: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    assignments: Array<
      {
        location_id: string;
        role_key: RoleKey;
      } & { employment?: EmploymentUpsert }
    >;
  }) =>
    apiPost<{
      user_id: string;
      status: "created" | "attached";
      assignments: number;
    }>("/v1/users", payload),

  update: (
    id: string,
    patch: {
      first_name?: string;
      last_name?: string;
      phone?: string | null;
      date_of_birth?: string | null;
      gender?: string | null;
      avatar_url?: string | null;
      address_json?: any;
      emergency_contact_json?: any;
    }
  ) => apiPatch<{ ok: true }>(`/v1/users/${id}`, patch),

  getEmployment: (user_id: string, location_id?: string) =>
    apiGet<EmploymentRecord[]>(
      `/v1/users/${user_id}/employment${qs({ location_id })}`
    ),

  upsertEmployment: (
    user_id: string,
    payload: { location_id: string } & EmploymentUpsert
  ) => apiPut<{ ok: true }>(`/v1/users/${user_id}/employment`, payload),
};

export const RolesAPI = {
  options: () => apiGet<RoleKey[]>("/v1/roles"),
  assign: (
    target_user_id: string,
    location_id: string,
    new_role: RoleKey,
    reason?: string
  ) =>
    apiPost<{ ok: true }>("/v1/roles/location", {
      target_user_id,
      location_id,
      new_role,
      reason,
    }),
  remove: (target_user_id: string, location_id: string) =>
    apiDeleteJson<{ ok: true }>("/v1/roles/location", {
      target_user_id,
      location_id,
    }),
};
