// apps/web/src/pages/Users.tsx
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UsersAPI,
  RolesAPI,
  Locations,
  type RoleKey,
  type UserWithAssignments,
  type Location,
  type ListUsersOptions,
} from "../lib/api";
import { useActiveLocation } from "../lib/activeLocation";
import { Modal } from "../components/ui/Modal";
import { useMe } from "../lib/useMe";
import { useNavigate } from "react-router-dom";

/* ───────────────────────── Toast (same vibe as Locations) ─── */
function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timer = React.useRef<number | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 5000);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setMsg(null);
  };
  const node = msg ? (
    <div className="fixed top-4 right-4 z-[1000]">
      <div className="rounded-lg shadow-lg border bg-white px-4 py-3 flex items-start gap-3">
        <div className="mt-0.5">✅</div>
        <div className="text-sm text-gray-800">{msg}</div>
        <button
          className="ml-2 text-gray-500 hover:text-gray-700"
          onClick={hide}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;
  return { show, hide, node };
}

/* ────────────────────────────────────────────────────────────── helpers ─── */

const ROLE_COLORS: Record<RoleKey, string> = {
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  SERVER: "bg-blue-50 text-blue-700 border-blue-200",
  CASHIER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COOK: "bg-orange-50 text-orange-700 border-orange-200",
  DISHWASHER: "bg-cyan-50 text-cyan-700 border-cyan-200",
  VIEW_ONLY: "bg-slate-50 text-slate-700 border-slate-200",
};

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
  );
}

function RoleBadge({ role }: { role: RoleKey }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${ROLE_COLORS[role]}`}
    >
      {role}
    </span>
  );
}

function ThSortable({
  label,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <th
      className={`border-b px-3 py-2 text-left text-sm font-medium text-gray-700 select-none ${className}`}
    >
      <button
        className={`inline-flex items-center gap-1 hover:text-brand-700 transition-colors ${
          active ? "text-brand-700" : ""
        }`}
        onClick={onClick}
      >
        <span>{label}</span>
        <span className="text-xs">
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td className={`border-t px-3 py-3 text-sm ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="transition-colors">
          <td className="px-3 py-3">
            <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-56 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3">
            <div className="flex gap-2">
              <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </td>
          <td className="px-3 py-3 text-right">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <span className="text-2xl">👀</span>
      </div>
      <div className="text-gray-800 font-medium">{message}</div>
      <div className="text-gray-500 text-sm mt-1">
        Try changing your filters or adding a new user.
      </div>
    </div>
  );
}

/** Visual multi-select dropdown with search + checkboxes */
function FilterDropdownMulti({
  label,
  icon,
  options,
  value,
  onChange,
  placeholder = "Select…",
  selectedText,
  disabled,
}: {
  label?: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  selectedText?: (
    value: string[],
    options: { value: string; label: string }[]
  ) => string | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.label.toLowerCase().includes(s));
  }, [q, options]);

  const custom = selectedText ? selectedText(value, options) : null;
  const selectedCount = value.length;
  const buttonLabel =
    custom ?? (selectedCount === 0 ? placeholder : `${selectedCount} selected`);

  const allValues = options.map((o) => o.value);
  const allSelected = selectedCount > 0 && selectedCount === options.length;

  return (
    <div className="relative" ref={ref}>
      {label && <div className="text-xs text-gray-600 mb-1">{label}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`input flex items-center justify-between min-w-[220px] ${disabled ? "opacity-50" : ""}`}
      >
        <span className="flex items-center gap-2">
          {icon}
          <span className={selectedCount ? "font-medium" : "text-gray-500"}>
            {buttonLabel}
          </span>
        </span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[320px] rounded-lg border bg-white shadow-lg">
          <div className="p-2 border-b bg-gray-50 rounded-t-lg">
            <input
              className="input w-full"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-auto p-2">
            <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={allSelected}
                onChange={() => onChange(allSelected ? [] : allValues)}
              />
              <span className="text-sm font-medium">Select all</span>
            </label>
            <div className="my-1 h-px bg-gray-100" />
            {filtered.map((o) => {
              const checked = value.includes(o.value);
              return (
                <label
                  key={o.value}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={checked}
                    onChange={() =>
                      onChange(
                        checked
                          ? value.filter((v) => v !== o.value)
                          : [...value, o.value]
                      )
                    }
                  />
                  <span className="text-sm">{o.label}</span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-sm text-gray-500">No matches</div>
            )}
          </div>
          <div className="flex items-center justify-between p-2 border-t bg-gray-50 rounded-b-lg">
            <button className="btn btn-ghost" onClick={() => onChange([])}>
              Clear
            </button>
            <button className="btn" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── page ─── */

type ModalKind = null | "create" | "edit";
type SortBy = "name" | "email" | "assignments" | "created_at";

// sentinel value representing "All locations" in the dropdown for admins
const ALL = "__ALL__";

export default function UsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: me } = useMe();
  const isAdmin = !!me?.is_global_admin;
  const { activeId, myLocations = [] } = useActiveLocation();

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: RolesAPI.options,
  });
  const { data: allLocations = [] } = useQuery({
    queryKey: ["locations-all"],
    queryFn: Locations.list,
  });

  // ── filters + sort
  const [q, setQ] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleKey[]>([]);
  const [locFilter, setLocFilter] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<SortBy>("created_at");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  // Non-admins: default to active location when empty filter.
  React.useEffect(() => {
    if (!isAdmin && activeId && locFilter.length === 0) {
      setLocFilter([activeId]);
    }
  }, [isAdmin, activeId]); // eslint-disable-line

  const locationOptions = React.useMemo(
    () => allLocations.map((l: Location) => ({ value: l.id, label: l.name })),
    [allLocations]
  );
  const adminLocOptions = React.useMemo(
    () =>
      isAdmin
        ? [{ value: ALL, label: "All locations" }, ...locationOptions]
        : locationOptions,
    [isAdmin, locationOptions]
  );
  const roleOptions = React.useMemo(
    () => roles.map((r) => ({ value: r, label: r })),
    [roles]
  );

  // Manager may only pick locations where they are MANAGER
  const managedLocationIds = React.useMemo(
    () => myLocations.filter((l) => l.my_role === "MANAGER").map((l) => l.id),
    [myLocations]
  );
  const managedLocOptions = React.useMemo(
    () => locationOptions.filter((o) => managedLocationIds.includes(o.value)),
    [locationOptions, managedLocationIds]
  );

  // Canonicalize admin location selection
  const setLocFilterCanon = (vals: string[]) => {
    if (isAdmin) {
      if (vals.includes(ALL)) setLocFilter([ALL]);
      else setLocFilter(vals);
    } else {
      setLocFilter(vals);
    }
  };

  // Build server list options
  const listOpts: ListUsersOptions = React.useMemo(() => {
    let locIds: string[] | undefined;

    if (isAdmin) {
      if (locFilter.includes(ALL)) {
        locIds = undefined; // show all users across all locations
      } else if (locFilter.length) {
        locIds = locFilter;
      } else if (activeId) {
        // if admin hasn't picked anything, follow header
        locIds = [activeId];
      } else {
        locIds = undefined;
      }
    } else {
      locIds = locFilter.length ? locFilter : activeId ? [activeId] : undefined;
    }

    return {
      q: q.trim() || undefined,
      roles: roleFilter.length ? roleFilter : undefined,
      location_ids: locIds,
      sort_by:
        sortBy === "assignments"
          ? "created_at"
          : (sortBy as "name" | "email" | "created_at"),
      sort_dir: sortDir,
    };
  }, [q, roleFilter, locFilter, isAdmin, activeId, sortBy, sortDir]);

  const { data: usersRaw = [], isLoading } = useQuery({
    queryKey: ["users", listOpts],
    queryFn: () => UsersAPI.list(listOpts),
    enabled: isAdmin || !!activeId,
  });

  const users: UserWithAssignments[] = React.useMemo(() => {
    const copy = [...usersRaw];
    if (sortBy === "name") {
      copy.sort((a, b) =>
        sortDir === "asc"
          ? a.full_name.localeCompare(b.full_name)
          : b.full_name.localeCompare(a.full_name)
      );
    } else if (sortBy === "assignments") {
      copy.sort((a, b) =>
        sortDir === "asc"
          ? a.assignments.length - b.assignments.length
          : b.assignments.length - a.assignments.length
      );
    }
    return copy;
  }, [usersRaw, sortBy, sortDir]);

  /* ───────────────────────────── Create modal ─── */

  type Employment = {
    position_title?: string;
    employment_type?: string;
    hire_date?: string;
    termination_date?: string;
    manager_user_id?: string;
    pay_rate?: string; // store as string; server encodes to bytea
    pay_currency?: string;
    scheduling_preferences?: any; // free-form JSON
  };
  type NewAssignRow = {
    location_id: string;
    role_key: RoleKey | "";
    employment?: Employment;
    _id: string; // local row key
  };

  const newAssignRow = (): NewAssignRow => ({
    location_id: "",
    role_key: "",
    employment: {
      position_title: "",
      employment_type: "",
      hire_date: "",
      termination_date: "",
      manager_user_id: "",
      pay_rate: "",
      pay_currency: "",
      scheduling_preferences: "",
    },
    _id: crypto.randomUUID(),
  });

  const [modal, setModal] = React.useState<ModalKind>(null);
  const [cForm, setCForm] = React.useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    // extended personal data (optional)
    date_of_birth: "",
    gender: "",
    address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    },
    emergency: {
      name: "",
      relation: "",
      phone: "",
      notes: "",
    },
    // multi-assignments with per-location employment
    assignments: [newAssignRow()] as NewAssignRow[],
  });
  const [cErrors, setCErrors] = React.useState<Record<string, string>>({});

  const validateCreate = () => {
    const e: Record<string, string> = {};
    if (!cForm.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(cForm.email)) e.email = "Invalid email";
    // assignments
    const filled = cForm.assignments.filter((a) => a.location_id && a.role_key);
    if (filled.length === 0) e.assignments = "Add at least one location + role";
    // dates sanity per row
    cForm.assignments.forEach((a, idx) => {
      const h = a.employment?.hire_date || "";
      const t = a.employment?.termination_date || "";
      if (h && t && new Date(t) < new Date(h)) {
        e[`assign_${idx}_dates`] = "Termination cannot be before hire date";
      }
      // scheduling prefs JSON
      const sp = a.employment?.scheduling_preferences;
      if (sp && typeof sp === "string") {
        try {
          JSON.parse(sp);
        } catch {
          e[`assign_${idx}_json`] = "Scheduling preferences must be valid JSON";
        }
      }
    });
    setCErrors(e);
    return Object.keys(e).length === 0;
  };

  const qcInvalidateUsers = async () => {
    await qc.invalidateQueries({ queryKey: ["users"] });
  };

  const createUser = useMutation({
    mutationFn: async () => {
      if (!validateCreate()) throw new Error("Please fix the form errors");

      // Build assignments payload
      const rows = cForm.assignments.filter((a) => a.location_id && a.role_key);
      const assignments = rows.map((a) => {
        const emp: any = {};
        if (a.employment?.position_title)
          emp.position_title = a.employment.position_title;
        if (a.employment?.employment_type)
          emp.employment_type = a.employment.employment_type;
        if (a.employment?.hire_date) emp.hire_date = a.employment.hire_date;
        if (a.employment?.termination_date)
          emp.termination_date = a.employment.termination_date;
        if (a.employment?.manager_user_id)
          emp.manager_user_id = a.employment.manager_user_id;
        if (a.employment?.pay_currency)
          emp.pay_currency = a.employment.pay_currency;
        // NOTE: pay_rate is applied via upsertEmployment after create
        if (a.employment?.scheduling_preferences) {
          try {
            emp.scheduling_preferences = JSON.parse(
              String(a.employment.scheduling_preferences || "{}")
            );
          } catch {
            /* already validated above */
          }
        }
        return {
          location_id: a.location_id,
          role_key: a.role_key as RoleKey,
          employment: Object.keys(emp).length ? emp : undefined,
        };
      });

      // Create
      const res = await UsersAPI.create({
        email: cForm.email.trim(),
        password: cForm.password || undefined,
        first_name: cForm.first_name || undefined,
        last_name: cForm.last_name || undefined,
        phone: cForm.phone || undefined,
        assignments,
      } as any);

      // Optional: send extended personal details (address, emergency, etc.)
      const patch: any = {};
      const addr = cForm.address;
      const hasAddr = Object.values(addr).some((v) => String(v).trim());
      if (hasAddr) patch.address_json = { ...addr };

      const em = cForm.emergency;
      const hasEm = Object.values(em).some((v) => String(v).trim());
      if (hasEm) {
        patch.emergency_contact_json = {
          name: em.name || null,
          relation: em.relation || null,
          phone: em.phone || null,
          notes: em.notes || null,
        };
      }
      if (cForm.date_of_birth) patch.date_of_birth = cForm.date_of_birth;
      if (cForm.gender) patch.gender = cForm.gender;

      if (Object.keys(patch).length) {
        await UsersAPI.update((res as any).user_id, patch as any);
      }

      // Ensure pay_rate is written per location via employment upsert
      const withRates = rows.filter(
        (r) => r.employment && r.employment.pay_rate
      );
      if (withRates.length) {
        await Promise.all(
          withRates.map((r) =>
            UsersAPI.upsertEmployment((res as any).user_id, {
              location_id: r.location_id,
              position_title: r.employment?.position_title || undefined,
              employment_type: r.employment?.employment_type || undefined,
              hire_date: r.employment?.hire_date || undefined,
              termination_date: r.employment?.termination_date || undefined,
              manager_user_id: r.employment?.manager_user_id || undefined,
              pay_currency: r.employment?.pay_currency || undefined,
              pay_rate: r.employment?.pay_rate || undefined,
              scheduling_preferences:
                r.employment?.scheduling_preferences &&
                typeof r.employment?.scheduling_preferences === "string"
                  ? JSON.parse(
                      r.employment?.scheduling_preferences as unknown as string
                    )
                  : r.employment?.scheduling_preferences || undefined,
            })
          )
        );
      }

      return res;
    },
    onSuccess: async () => {
      setModal(null);
      setCForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        address: {
          street: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
        },
        emergency: { name: "", relation: "", phone: "", notes: "" },
        assignments: [newAssignRow()],
      });
      setCErrors({});
      await qcInvalidateUsers();
      toast.show("User created");
      navigate("/app/users", { replace: true });
    },
    onError: (err: any) => {
      toast.show(err?.message || "Failed to create user");
    },
  });

  /* ───────────────────────────── Edit modal ─── */

  const [editing, setEditing] = React.useState<UserWithAssignments | null>(
    null
  );
  const [editProfile, setEditProfile] = React.useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: { street: "", city: "", state: "", postal_code: "", country: "" },
    emergency: { name: "", relation: "", phone: "", notes: "" },
  });

  // In edit mode, keep roles and employment side-by-side
  type EmploymentForm = {
    position_title?: string;
    employment_type?: string;
    hire_date?: string;
    termination_date?: string;
    manager_user_id?: string;
    pay_rate?: string;
    pay_currency?: string;
    scheduling_preferences?: string; // text area with JSON
  };
  const [editAssigns, setEditAssigns] = React.useState<
    { location_id: string; role_key: RoleKey }[]
  >([]);
  const [editEmployment, setEditEmployment] = React.useState<
    Record<string, EmploymentForm>
  >({});
  const [empErrors, setEmpErrors] = React.useState<Record<string, string>>({});

  // Load per-user profile + assignments
  async function debugLoadUser(id: string) {
    // fetch and return without logging
    const u = await UsersAPI.get(id);
    return u;
  }

  async function handleEdit(userId: string) {
    try {
      const u = await debugLoadUser(userId);

      const addr = (u as any).address_json ?? {
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      };
      const emg = (u as any).emergency_contact_json ?? {
        name: "",
        relation: "",
        phone: "",
        notes: "",
      };

      setEditing({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        is_global_admin: u.is_global_admin,
        assignments: u.assignments ?? [],
      });

      setEditProfile({
        first_name: (u as any).first_name ?? "",
        last_name: (u as any).last_name ?? "",
        phone: u.phone ?? "",
        date_of_birth: (u as any).date_of_birth ?? "",
        gender: (u as any).gender ?? "",
        address: {
          street: addr.street ?? "",
          city: addr.city ?? "",
          state: addr.state ?? "",
          postal_code: addr.postal_code ?? "",
          country: addr.country ?? "",
        },
        emergency: {
          name: emg.name ?? "",
          relation: emg.relation ?? "",
          phone: emg.phone ?? "",
          notes: emg.notes ?? "",
        },
      });

      // prime role list from assignments
      setEditAssigns(
        (u.assignments || []).map((a) => ({
          location_id: a.location_id,
          role_key: a.role_key as RoleKey,
        }))
      );

      setEmpErrors({});
      setModal("edit");
    } catch (e: any) {
      toast.show(e?.message || "Failed to load user");
    }
  }

  // Load per-location employment when modal opens
  React.useEffect(() => {
    (async () => {
      if (!editing || modal !== "edit") return;
      try {
        const rows = await UsersAPI.getEmployment(editing.user_id);
        // console.log(rows);
        const map: Record<string, EmploymentForm> = {};
        (rows || []).forEach((r) => {
          map[r.location_id] = {
            position_title: r.position_title || "",
            employment_type: r.employment_type || "",
            hire_date: r.hire_date || "",
            termination_date: r.termination_date || "",
            manager_user_id: r.manager_user_id || "",
            // pay_rate: "", // never read back; write-only
            pay_rate: r.pay_rate || undefined,
            pay_currency: r.pay_currency || "",
            scheduling_preferences: r.scheduling_preferences
              ? JSON.stringify(r.scheduling_preferences, null, 2)
              : "",
          };
        });
        setEditEmployment(map);
      } catch (e: any) {
        toast.show(e?.message || "Failed to load employment");
      }
    })();
  }, [editing, modal]); // eslint-disable-line

  const saveProfile = useMutation({
    mutationFn: () =>
      editing
        ? UsersAPI.update(editing.user_id, {
            first_name: editProfile.first_name || undefined,
            last_name: editProfile.last_name || undefined,
            phone: editProfile.phone || undefined,
            date_of_birth: editProfile.date_of_birth || undefined,
            gender: editProfile.gender || undefined,
            address_json: Object.values(editProfile.address || {}).some((v) =>
              String(v || "").trim()
            )
              ? editProfile.address
              : undefined,
            emergency_contact_json: Object.values(
              editProfile.emergency || {}
            ).some((v) => String(v || "").trim())
              ? editProfile.emergency
              : undefined,
          } as any)
        : Promise.resolve({ ok: true } as any),
    onSuccess: async () => {
      await qcInvalidateUsers();
      toast.show("Profile updated");
      navigate("/app/users", { replace: true });
    },
    onError: (err: any) =>
      toast.show(err?.message || "Failed to update profile"),
  });

  const canEditEmployment = (locId: string) =>
    isAdmin || managedLocationIds.includes(locId);

  const saveAssignments = useMutation({
    mutationFn: async () => {
      if (!editing) return;

      // Validate JSON/date per location to avoid partial saves
      const localErrors: Record<string, string> = {};
      for (const locId of Object.keys(editEmployment)) {
        const e = editEmployment[locId];
        if (e.hire_date && e.termination_date) {
          if (new Date(e.termination_date) < new Date(e.hire_date)) {
            localErrors[locId] = "Termination cannot be before hire date";
          }
        }
        if (e.scheduling_preferences) {
          try {
            JSON.parse(e.scheduling_preferences);
          } catch {
            localErrors[locId] = "Scheduling preferences must be valid JSON";
          }
        }
      }
      if (Object.keys(localErrors).length) {
        setEmpErrors(localErrors);
        throw new Error("Please fix employment errors");
      } else {
        setEmpErrors({});
      }

      const before = new Map(
        editing.assignments.map((a) => [a.location_id, a.role_key as RoleKey])
      );
      const after = new Map(
        editAssigns.map((a) => [a.location_id, a.role_key])
      );
      const ops: Promise<any>[] = [];

      // Role updates/new
      after.forEach((role, locId) => {
        if (before.get(locId) !== role)
          ops.push(RolesAPI.assign(editing.user_id, locId, role));
      });

      // Role removals (admins OR managers at their active location)
      before.forEach((_role, locId) => {
        const canTouch = isAdmin || (activeId && locId === activeId);
        if (canTouch && !after.has(locId))
          ops.push(RolesAPI.remove(editing.user_id, locId));
      });

      // Employment upserts (admin or manager of that location)
      for (const [locId, form] of Object.entries(editEmployment)) {
        if (!canEditEmployment(locId)) continue;
        const payload: any = {
          location_id: locId,
          position_title: form.position_title || undefined,
          employment_type: form.employment_type || undefined,
          hire_date: form.hire_date || undefined,
          termination_date: form.termination_date || undefined,
          manager_user_id: form.manager_user_id || undefined,
          pay_currency: form.pay_currency || undefined,
          pay_rate: form.pay_rate || undefined,
          scheduling_preferences: form.scheduling_preferences
            ? JSON.parse(form.scheduling_preferences)
            : undefined,
        };
        ops.push(UsersAPI.upsertEmployment(editing.user_id, payload));
      }

      await Promise.all(ops);
    },
    onSuccess: async () => {
      await qcInvalidateUsers();
      toast.show("Assignments & employment saved");
      navigate("/app/users", { replace: true });
    },
    onError: (err: any) =>
      toast.show(err?.message || "Failed to save assignments"),
  });

  const canEditAssignments = (locId: string) =>
    isAdmin ? true : !!activeId && locId === activeId;

  /* ─────────────────────────────────────────────────────────────── UI ─── */

  return (
    <div className="space-y-5">
      {toast.node}

      {/* Title + action */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Users</h1>
        <button className="btn btn-primary" onClick={() => setModal("create")}>
          + New User
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              className="input pl-10 w-[260px]"
              placeholder="Search name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
          </div>

          {/* Roles */}
          <FilterDropdownMulti
            label="Roles"
            icon={<span>👥</span>}
            options={roleOptions}
            value={roleFilter}
            onChange={(vals) => setRoleFilter(vals as RoleKey[])}
            placeholder="All roles"
          />

          {/* Locations (admins: includes 'All locations' sentinel) */}
          <FilterDropdownMulti
            label="Locations"
            icon={<span>📍</span>}
            options={adminLocOptions}
            value={
              isAdmin
                ? locFilter.length
                  ? locFilter
                  : activeId
                    ? [activeId]
                    : [ALL]
                : locFilter.length
                  ? locFilter
                  : activeId
                    ? [activeId]
                    : []
            }
            onChange={setLocFilterCanon}
            placeholder="All locations"
            selectedText={(vals) =>
              vals.includes(ALL) ? "All locations" : null
            }
            disabled={false}
          />

          <div className="ml-auto flex items-center gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setQ("");
                setRoleFilter([]);
                setLocFilter(isAdmin ? [ALL] : activeId ? [activeId] : []);
                setSortBy("created_at");
                setSortDir("desc");
              }}
              title="Clear all filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <ThSortable
                  label="Name"
                  active={sortBy === "name"}
                  dir={sortDir}
                  onClick={() => {
                    setSortBy("name");
                    setSortDir((d) =>
                      sortBy === "name" ? (d === "asc" ? "desc" : "asc") : "asc"
                    );
                  }}
                />
                <ThSortable
                  label="Email"
                  active={sortBy === "email"}
                  dir={sortDir}
                  onClick={() => {
                    setSortBy("email");
                    setSortDir((d) =>
                      sortBy === "email"
                        ? d === "asc"
                          ? "desc"
                          : "asc"
                        : "asc"
                    );
                  }}
                />
                <ThSortable
                  label="Assignments"
                  active={sortBy === "assignments"}
                  dir={sortDir}
                  onClick={() => {
                    setSortBy("assignments");
                    setSortDir((d) =>
                      sortBy === "assignments"
                        ? d === "asc"
                          ? "desc"
                          : "asc"
                        : "asc"
                    );
                  }}
                />
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows rows={8} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState message="No users match your filters." />
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.user_id}
                    className={`transition-colors ${
                      i % 2 ? "bg-gray-50/60" : "bg-white"
                    } hover:bg-brand-50/60`}
                  >
                    <Td>{u.full_name}</Td>
                    <Td className="text-gray-700">{u.email}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        {u.assignments.length === 0 ? (
                          <span className="text-xs text-gray-500">
                            No locations
                          </span>
                        ) : (
                          u.assignments.map((a) => (
                            <span
                              key={`${a.location_id}-${a.role_key}`}
                              className="inline-flex items-center gap-2"
                            >
                              <span className="px-2 py-0.5 rounded-full border bg-white text-xs">
                                {a.location_name}
                              </span>
                              <RoleBadge role={a.role_key as RoleKey} />
                            </span>
                          ))
                        )}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <button
                        className="btn"
                        onClick={() => handleEdit(u.user_id)}
                      >
                        Edit
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create */}
      <Modal
        open={modal === "create"}
        onClose={() => {
          if (!createUser.isPending) setModal(null);
        }}
        title="Add user"
        footer={
          <>
            <button
              className="btn"
              onClick={() => setModal(null)}
              disabled={createUser.isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={() => createUser.mutate()}
              disabled={createUser.isPending}
            >
              {createUser.isPending && <Spinner />}
              Save
            </button>
          </>
        }
      >
        {/* Scrollable content */}
        <div className="grid gap-4 max-h-[70vh] overflow-auto pr-1">
          {/* Personal */}
          <section className="rounded border">
            <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
              Personal information
            </div>
            <div className="p-3 grid gap-3">
              <div>
                <input
                  className={`input w-full ${cErrors.email ? "border-red-400" : ""}`}
                  placeholder="Email *"
                  value={cForm.email}
                  onChange={(e) =>
                    setCForm({ ...cForm, email: e.target.value })
                  }
                />
                {cErrors.email && (
                  <div className="text-xs text-red-600 mt-1">
                    {cErrors.email}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="First name"
                  value={cForm.first_name}
                  onChange={(e) =>
                    setCForm({ ...cForm, first_name: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Last name"
                  value={cForm.last_name}
                  onChange={(e) =>
                    setCForm({ ...cForm, last_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Phone"
                  value={cForm.phone}
                  onChange={(e) =>
                    setCForm({ ...cForm, phone: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Password (for brand-new only)"
                  type="password"
                  value={cForm.password}
                  onChange={(e) =>
                    setCForm({ ...cForm, password: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Date of birth (YYYY-MM-DD)"
                  value={cForm.date_of_birth}
                  onChange={(e) =>
                    setCForm({ ...cForm, date_of_birth: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Gender (optional)"
                  value={cForm.gender}
                  onChange={(e) =>
                    setCForm({ ...cForm, gender: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="rounded border">
            <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
              Address (optional)
            </div>
            <div className="p-3 grid gap-3">
              <input
                className="input"
                placeholder="Street"
                value={cForm.address.street}
                onChange={(e) =>
                  setCForm({
                    ...cForm,
                    address: { ...cForm.address, street: e.target.value },
                  })
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="City"
                  value={cForm.address.city}
                  onChange={(e) =>
                    setCForm({
                      ...cForm,
                      address: { ...cForm.address, city: e.target.value },
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="State"
                  value={cForm.address.state}
                  onChange={(e) =>
                    setCForm({
                      ...cForm,
                      address: { ...cForm.address, state: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="input"
                  placeholder="Postal code"
                  value={cForm.address.postal_code}
                  onChange={(e) =>
                    setCForm({
                      ...cForm,
                      address: {
                        ...cForm.address,
                        postal_code: e.target.value,
                      },
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Country"
                  value={cForm.address.country}
                  onChange={(e) =>
                    setCForm({
                      ...cForm,
                      address: { ...cForm.address, country: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="rounded border">
            <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
              Emergency contact (optional)
            </div>
            <div className="p-3 grid gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Name"
                  value={cForm.emergency.name}
                  onChange={(e) =>
                    setCForm({
                      ...cForm,
                      emergency: { ...cForm.emergency, name: e.target.value },
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Relationship"
                  value={cForm.emergency.relation}
                  onChange={(e) =>
                    setCForm({
                      ...cForm,
                      emergency: {
                        ...cForm.emergency,
                        relation: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <input
                className="input"
                placeholder="Phone"
                value={cForm.emergency.phone}
                onChange={(e) =>
                  setCForm({
                    ...cForm,
                    emergency: { ...cForm.emergency, phone: e.target.value },
                  })
                }
              />
              <textarea
                className="input h-20"
                placeholder="Notes"
                value={cForm.emergency.notes}
                onChange={(e) =>
                  setCForm({
                    ...cForm,
                    emergency: { ...cForm.emergency, notes: e.target.value },
                  })
                }
              />
            </div>
          </section>

          {/* Assignments (multi) */}
          <section className="rounded border">
            <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
              Location assignments
            </div>
            <div className="p-3 grid gap-4">
              {cErrors.assignments && (
                <div className="text-sm text-red-600">
                  {cErrors.assignments}
                </div>
              )}
              {cForm.assignments.map((row, idx) => {
                const usedLocIds = new Set(
                  cForm.assignments.map((r) => r.location_id).filter(Boolean)
                );
                const allOpts = isAdmin ? locationOptions : managedLocOptions;
                const opts = allOpts.filter(
                  (o) => !usedLocIds.has(o.value) || o.value === row.location_id
                );

                const datesErr = cErrors[`assign_${idx}_dates`];
                const jsonErr = cErrors[`assign_${idx}_json`];

                return (
                  <div
                    key={row._id}
                    className="rounded border p-3 bg-white grid gap-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        className="input"
                        value={row.location_id}
                        onChange={(e) => {
                          const v = e.target.value;
                          const next = [...cForm.assignments];
                          next[idx] = { ...row, location_id: v };
                          setCForm({ ...cForm, assignments: next });
                        }}
                      >
                        <option value="">
                          {isAdmin
                            ? "Select location *"
                            : "Select managed location *"}
                        </option>
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="input"
                        value={row.role_key}
                        onChange={(e) => {
                          const v = e.target.value as RoleKey | "";
                          const next = [...cForm.assignments];
                          next[idx] = { ...row, role_key: v };
                          setCForm({ ...cForm, assignments: next });
                        }}
                      >
                        <option value="">Select role *</option>
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          className="btn"
                          onClick={() => {
                            const next = cForm.assignments.filter(
                              (r) => r._id !== row._id
                            );
                            setCForm({
                              ...cForm,
                              assignments: next.length
                                ? next
                                : [newAssignRow()],
                            });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Professional details (per-location) */}
                    <div className="grid gap-3">
                      <div className="text-xs text-gray-600 font-medium">
                        Professional (optional)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          className="input"
                          placeholder="Position title"
                          value={row.employment?.position_title || ""}
                          onChange={(e) => {
                            const next = [...cForm.assignments];
                            next[idx] = {
                              ...row,
                              employment: {
                                ...(row.employment || {}),
                                position_title: e.target.value,
                              },
                            };
                            setCForm({ ...cForm, assignments: next });
                          }}
                        />
                        <input
                          className="input"
                          placeholder="Employment type (full-time, part-time…)"
                          value={row.employment?.employment_type || ""}
                          onChange={(e) => {
                            const next = [...cForm.assignments];
                            next[idx] = {
                              ...row,
                              employment: {
                                ...(row.employment || {}),
                                employment_type: e.target.value,
                              },
                            };
                            setCForm({ ...cForm, assignments: next });
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          className="input"
                          type="date"
                          placeholder="Hire date"
                          value={row.employment?.hire_date || ""}
                          onChange={(e) => {
                            const next = [...cForm.assignments];
                            next[idx] = {
                              ...row,
                              employment: {
                                ...(row.employment || {}),
                                hire_date: e.target.value,
                              },
                            };
                            setCForm({ ...cForm, assignments: next });
                          }}
                        />
                        <input
                          className="input"
                          type="date"
                          placeholder="Termination date"
                          value={row.employment?.termination_date || ""}
                          onChange={(e) => {
                            const next = [...cForm.assignments];
                            next[idx] = {
                              ...row,
                              employment: {
                                ...(row.employment || {}),
                                termination_date: e.target.value,
                              },
                            };
                            setCForm({ ...cForm, assignments: next });
                          }}
                        />
                      </div>

                      {datesErr && (
                        <div className="text-xs text-red-600">{datesErr}</div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          className="input"
                          placeholder="Manager user ID (optional)"
                          value={row.employment?.manager_user_id || ""}
                          onChange={(e) => {
                            const next = [...cForm.assignments];
                            next[idx] = {
                              ...row,
                              employment: {
                                ...(row.employment || {}),
                                manager_user_id: e.target.value,
                              },
                            };
                            setCForm({ ...cForm, assignments: next });
                          }}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className="input"
                            placeholder="Pay rate (e.g., 18.50)"
                            value={row.employment?.pay_rate || ""}
                            onChange={(e) => {
                              const next = [...cForm.assignments];
                              next[idx] = {
                                ...row,
                                employment: {
                                  ...(row.employment || {}),
                                  pay_rate: e.target.value,
                                },
                              };
                              setCForm({ ...cForm, assignments: next });
                            }}
                          />
                          <input
                            className="input"
                            placeholder="Currency (e.g., USD)"
                            value={row.employment?.pay_currency || ""}
                            onChange={(e) => {
                              const next = [...cForm.assignments];
                              next[idx] = {
                                ...row,
                                employment: {
                                  ...(row.employment || {}),
                                  pay_currency: e.target.value,
                                },
                              };
                              setCForm({ ...cForm, assignments: next });
                            }}
                          />
                        </div>
                      </div>

                      {jsonErr && (
                        <div className="text-xs text-red-600">{jsonErr}</div>
                      )}

                      <textarea
                        className="input h-20 font-mono text-xs"
                        placeholder='Scheduling preferences JSON (e.g. {"max_hours":30})'
                        value={String(
                          row.employment?.scheduling_preferences || ""
                        )}
                        onChange={(e) => {
                          const next = [...cForm.assignments];
                          next[idx] = {
                            ...row,
                            employment: {
                              ...(row.employment || {}),
                              scheduling_preferences: e.target.value,
                            },
                          };
                          setCForm({ ...cForm, assignments: next });
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <div>
                <button
                  className="btn"
                  onClick={() =>
                    setCForm({
                      ...cForm,
                      assignments: [...cForm.assignments, newAssignRow()],
                    })
                  }
                  disabled={!isAdmin && managedLocOptions.length === 0}
                  title={
                    !isAdmin && managedLocOptions.length === 0
                      ? "You are not a manager of any location"
                      : ""
                  }
                >
                  + Add another location
                </button>
              </div>
            </div>
          </section>
        </div>

        {createUser.isError && (
          <div className="text-red-600 text-sm mt-2">
            {(createUser.error as any)?.message}
          </div>
        )}
      </Modal>

      {/* Edit */}
      <Modal
        open={modal === "edit"}
        onClose={() => {
          if (!saveProfile.isPending && !saveAssignments.isPending) {
            setModal(null);
            setEditing(null);
          }
        }}
        title={editing ? `Edit ${editing.full_name}` : "Edit user"}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn"
              onClick={() => {
                setModal(null);
                setEditing(null);
              }}
              disabled={saveProfile.isPending || saveAssignments.isPending}
            >
              Close
            </button>
            <button
              className="btn inline-flex items-center gap-2"
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending && <Spinner />}
              Save profile
            </button>
            <button
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={() => saveAssignments.mutate()}
              disabled={saveAssignments.isPending}
              title="Saves role changes and employment for each location"
            >
              {saveAssignments.isPending && <Spinner />}
              Save roles & employment
            </button>
          </div>
        }
      >
        {editing && (
          <div className="grid gap-4 max-h-[70vh] overflow-auto pr-1">
            {/* Personal */}
            <section className="rounded border">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
                Personal information
              </div>
              <div className="p-3 grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="First name"
                    value={editProfile.first_name}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        first_name: e.target.value,
                      })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Last name"
                    value={editProfile.last_name}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        last_name: e.target.value,
                      })
                    }
                  />
                </div>
                <input
                  className="input"
                  placeholder="Phone"
                  value={editProfile.phone}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, phone: e.target.value })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Date of birth (YYYY-MM-DD)"
                    value={editProfile.date_of_birth}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        date_of_birth: e.target.value,
                      })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Gender (optional)"
                    value={editProfile.gender}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        gender: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="rounded border">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
                Address (optional)
              </div>
              <div className="p-3 grid gap-3">
                <input
                  className="input"
                  placeholder="Street"
                  value={editProfile.address.street}
                  onChange={(e) =>
                    setEditProfile({
                      ...editProfile,
                      address: {
                        ...editProfile.address,
                        street: e.target.value,
                      },
                    })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="City"
                    value={editProfile.address.city}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        address: {
                          ...editProfile.address,
                          city: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    className="input"
                    placeholder="State"
                    value={editProfile.address.state}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        address: {
                          ...editProfile.address,
                          state: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="input"
                    placeholder="Postal code"
                    value={editProfile.address.postal_code}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        address: {
                          ...editProfile.address,
                          postal_code: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Country"
                    value={editProfile.address.country}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        address: {
                          ...editProfile.address,
                          country: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Emergency contact */}
            <section className="rounded border">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
                Emergency contact (optional)
              </div>
              <div className="p-3 grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Name"
                    value={editProfile.emergency.name}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        emergency: {
                          ...editProfile.emergency,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Relationship"
                    value={editProfile.emergency.relation}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        emergency: {
                          ...editProfile.emergency,
                          relation: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <input
                  className="input"
                  placeholder="Phone"
                  value={editProfile.emergency.phone}
                  onChange={(e) =>
                    setEditProfile({
                      ...editProfile,
                      emergency: {
                        ...editProfile.emergency,
                        phone: e.target.value,
                      },
                    })
                  }
                />
                <textarea
                  className="input h-20"
                  placeholder="Notes"
                  value={editProfile.emergency.notes}
                  onChange={(e) =>
                    setEditProfile({
                      ...editProfile,
                      emergency: {
                        ...editProfile.emergency,
                        notes: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </section>

            {/* Assignments & Employment */}
            <section className="rounded border">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
                Location roles & employment
              </div>
              <div className="p-3 grid gap-4">
                {editAssigns.map((row, idx) => {
                  const locId = row.location_id;
                  const emp = editEmployment[locId] || {
                    position_title: "",
                    employment_type: "",
                    hire_date: "",
                    termination_date: "",
                    manager_user_id: "",
                    pay_rate: "",
                    pay_currency: "",
                    scheduling_preferences: "",
                  };
                  const canEditEmp = canEditEmployment(locId);
                  const err = empErrors[locId];

                  return (
                    <div
                      key={row.location_id}
                      className="grid gap-2 rounded border p-3 bg-white"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <select
                          className="input col-span-2"
                          value={row.location_id}
                          disabled
                        >
                          {locationOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className="input"
                          value={row.role_key}
                          onChange={(
                            e: React.ChangeEvent<HTMLSelectElement>
                          ) => {
                            const next = [...editAssigns];
                            next[idx] = {
                              ...row,
                              role_key: e.target.value as RoleKey,
                            };
                            setEditAssigns(next);
                          }}
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <div className="md:col-span-3">
                          <button
                            className="btn"
                            onClick={() => {
                              setEditAssigns(
                                editAssigns.filter((_, i) => i !== idx)
                              );
                            }}
                            disabled={!canEditAssignments(row.location_id)}
                            title={
                              canEditAssignments(row.location_id)
                                ? "Remove role from this location"
                                : "You can only remove at your active location"
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Employment fields */}
                      <div className="grid gap-2 mt-1">
                        <div className="text-xs text-gray-600 font-medium">
                          Employment (admin or manager of this location)
                        </div>
                        <div className="grid grid-cols-1 md-grid-cols-2 md:grid-cols-2 gap-3">
                          <input
                            className="input"
                            placeholder="Position title"
                            value={emp.position_title}
                            onChange={(e) =>
                              setEditEmployment({
                                ...editEmployment,
                                [locId]: {
                                  ...emp,
                                  position_title: e.target.value,
                                },
                              })
                            }
                            disabled={!canEditEmp}
                          />
                          <input
                            className="input"
                            placeholder="Employment type"
                            value={emp.employment_type}
                            onChange={(e) =>
                              setEditEmployment({
                                ...editEmployment,
                                [locId]: {
                                  ...emp,
                                  employment_type: e.target.value,
                                },
                              })
                            }
                            disabled={!canEditEmp}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            className="input"
                            type="date"
                            placeholder="Hire date"
                            value={emp.hire_date}
                            onChange={(e) =>
                              setEditEmployment({
                                ...editEmployment,
                                [locId]: { ...emp, hire_date: e.target.value },
                              })
                            }
                            disabled={!canEditEmp}
                          />
                          <input
                            className="input"
                            type="date"
                            placeholder="Termination date"
                            value={emp.termination_date}
                            onChange={(e) =>
                              setEditEmployment({
                                ...editEmployment,
                                [locId]: {
                                  ...emp,
                                  termination_date: e.target.value,
                                },
                              })
                            }
                            disabled={!canEditEmp}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            className="input"
                            placeholder="Manager user ID"
                            value={emp.manager_user_id}
                            onChange={(e) =>
                              setEditEmployment({
                                ...editEmployment,
                                [locId]: {
                                  ...emp,
                                  manager_user_id: e.target.value,
                                },
                              })
                            }
                            disabled={!canEditEmp}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              className="input"
                              placeholder="Pay rate"
                              value={emp.pay_rate}
                              onChange={(e) =>
                                setEditEmployment({
                                  ...editEmployment,
                                  [locId]: {
                                    ...emp,
                                    pay_rate: e.target.value,
                                  },
                                })
                              }
                              disabled={!canEditEmp}
                            />
                            <input
                              className="input"
                              placeholder="Currency (e.g., USD)"
                              value={emp.pay_currency}
                              onChange={(e) =>
                                setEditEmployment({
                                  ...editEmployment,
                                  [locId]: {
                                    ...emp,
                                    pay_currency: e.target.value,
                                  },
                                })
                              }
                              disabled={!canEditEmp}
                            />
                          </div>
                        </div>

                        <textarea
                          className="input h-20 font-mono text-xs"
                          placeholder='Scheduling preferences JSON (e.g., {"max_hours": 30})'
                          value={emp.scheduling_preferences || ""}
                          onChange={(e) =>
                            setEditEmployment({
                              ...editEmployment,
                              [locId]: {
                                ...emp,
                                scheduling_preferences: e.target.value,
                              },
                            })
                          }
                          disabled={!canEditEmp}
                        />

                        {err && (
                          <div className="text-xs text-red-600">{err}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <AddAssignmentRow
                  isAdmin={isAdmin}
                  activeId={activeId || ""}
                  locations={locationOptions}
                  roles={roles}
                  onAdd={(locId, role) => {
                    if (editAssigns.find((a) => a.location_id === locId))
                      return;
                    setEditAssigns([
                      ...editAssigns,
                      { location_id: locId, role_key: role },
                    ]);
                    setEditEmployment((prev) => ({
                      ...prev,
                      [locId]: {
                        position_title: "",
                        employment_type: "",
                        hire_date: "",
                        termination_date: "",
                        manager_user_id: "",
                        pay_rate: "",
                        pay_currency: "",
                        scheduling_preferences: "",
                      },
                    }));
                  }}
                />
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AddAssignmentRow({
  isAdmin,
  activeId,
  locations,
  roles,
  onAdd,
}: {
  isAdmin: boolean;
  activeId: string;
  locations: { value: string; label: string }[];
  roles: RoleKey[];
  onAdd: (location_id: string, role: RoleKey) => void;
}) {
  const [loc, setLoc] = React.useState<string>(isAdmin ? "" : activeId);
  const [role, setRole] = React.useState<RoleKey | "">("");

  const locOpts = isAdmin
    ? locations
    : locations.filter((l) => l.value === activeId);

  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      <select
        className="input col-span-2"
        value={loc}
        onChange={(e) => setLoc(e.target.value)}
        disabled={!isAdmin}
      >
        <option value="">
          {isAdmin ? "Select location" : "Active location"}
        </option>
        {locOpts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={role}
        onChange={(e) => setRole(e.target.value as RoleKey)}
      >
        <option value="">Select role</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <div className="col-span-3">
        <button
          className="btn"
          onClick={() => loc && role && onAdd(loc, role as RoleKey)}
          disabled={!loc || !role}
        >
          Add
        </button>
      </div>
    </div>
  );
}
