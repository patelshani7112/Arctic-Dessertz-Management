// apps/web/src/pages/Locations.tsx
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Locations, type Location } from "../lib/api";
import { useMe } from "../lib/useMe";
import { useActiveLocation } from "../lib/activeLocation";
import { Modal } from "../components/ui/Modal";

/* ─────────────────────────────── Toast ─── */
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

/* ────────────────────── Common table bits ─── */
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
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-brand-700 transition-colors ${
          active ? "text-brand-700" : ""
        }`}
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
        <tr key={i}>
          <td className="px-3 py-3">
            <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3 w-44 bg-gray-200 rounded animate-pulse" />
          </td>
          <td className="px-3 py-3 text-right">
            <div className="h-8 w-28 bg-gray-200 rounded animate-pulse ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
function Spinner() {
  return (
    <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
  );
}

/* ───────────────────── Filter dropdown (multi) ─── */
function FilterDropdownMulti({
  label,
  icon,
  options,
  value,
  onChange,
  placeholder = "Select…",
  selectedText,
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
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between min-w-[220px]"
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

/* ───────────────────── Hours editor ─── */
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Interval = { open: string; close: string };
type DayHours = { closed?: boolean; intervals: Interval[] };
type HoursJson = Record<DayKey, DayHours>;
const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];
function defaultHours(): HoursJson {
  const base: DayHours = {
    closed: false,
    intervals: [{ open: "", close: "" }],
  };
  return {
    mon: { ...base },
    tue: { ...base },
    wed: { ...base },
    thu: { ...base },
    fri: { ...base },
    sat: { ...base },
    sun: { ...base },
  };
}
function HoursEditor({
  value,
  onChange,
  error,
  submitted,
}: {
  value: HoursJson;
  onChange: (v: HoursJson) => void;
  error?: string | null;
  submitted?: boolean;
}) {
  const setDay = (key: DayKey, updater: (d: DayHours) => DayHours) =>
    onChange({ ...value, [key]: updater(value[key]) });

  return (
    <div className="rounded border bg-gray-50">
      <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
        Opening hours
      </div>
      <div className="p-3 grid gap-2">
        {DAYS.map((d) => {
          const row = value[d.key] || {
            closed: false,
            intervals: [{ open: "", close: "" }],
          };
          return (
            <div
              key={d.key}
              className="grid grid-cols-1 md:grid-cols-[60px_1fr_auto] items-start gap-3 bg-white rounded border p-2"
            >
              <div className="text-sm font-medium">{d.label}</div>
              {row.closed ? (
                <div className="text-sm text-gray-500 md:mt-1">Closed</div>
              ) : (
                <div className="grid gap-2">
                  {row.intervals.map((itv, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2"
                    >
                      <input
                        type="time"
                        className="input w-full"
                        value={itv.open}
                        onChange={(e) =>
                          setDay(d.key, (old) => {
                            const next = [...old.intervals];
                            next[idx] = { ...next[idx], open: e.target.value };
                            return { ...old, intervals: next };
                          })
                        }
                      />
                      <input
                        type="time"
                        className="input w-full"
                        value={itv.close}
                        onChange={(e) =>
                          setDay(d.key, (old) => {
                            const next = [...old.intervals];
                            next[idx] = { ...next[idx], close: e.target.value };
                            return { ...old, intervals: next };
                          })
                        }
                      />
                      <button
                        className="btn justify-self-start sm:justify-self-auto"
                        onClick={() =>
                          setDay(d.key, (old) => ({
                            ...old,
                            intervals: old.intervals.filter(
                              (_, i) => i !== idx
                            ),
                          }))
                        }
                        disabled={row.intervals.length <= 1}
                        title="Remove interval"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div>
                    <button
                      className="btn"
                      onClick={() =>
                        setDay(d.key, (old) => ({
                          ...old,
                          intervals: [
                            ...old.intervals,
                            { open: "", close: "" },
                          ],
                        }))
                      }
                    >
                      + Add interval
                    </button>
                  </div>
                </div>
              )}
              <label className="text-sm flex items-center gap-2 md:justify-self-end">
                <input
                  type="checkbox"
                  checked={!!row.closed}
                  onChange={(e) =>
                    setDay(d.key, () => ({
                      closed: e.target.checked,
                      intervals: [{ open: "", close: "" }],
                    }))
                  }
                />
                Closed
              </label>
            </div>
          );
        })}
        {submitted && error && (
          <div className="text-xs text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
}
function normalizeHours(raw: any): HoursJson {
  const base = defaultHours();
  if (!raw || typeof raw !== "object") return base;
  const out: any = { ...base };
  (Object.keys(base) as DayKey[]).forEach((k) => {
    const v = raw[k];
    if (!v) return;
    const intervals: Interval[] = Array.isArray(v.intervals)
      ? v.intervals.map((x: any) => ({
          open: typeof x.open === "string" ? x.open : "",
          close: typeof x.close === "string" ? x.close : "",
        }))
      : [{ open: "", close: "" }];
    out[k] = {
      closed: !!v.closed,
      intervals: intervals.length ? intervals : [{ open: "", close: "" }],
    };
  });
  return out;
}
function hoursToJson(h: HoursJson) {
  const clean: any = {};
  (Object.keys(h) as DayKey[]).forEach((k) => {
    const d = h[k];
    clean[k] = {
      closed: !!d.closed,
      intervals: (d.intervals || []).filter((x) => x.open && x.close),
    };
  });
  return clean;
}

/* ───────────────────────────── Page ─── */
type ModalKind = null | "create" | "edit";
type SortBy = "name" | "brand" | "tz" | "status" | "created_at";

const blankForm = {
  name: "",
  brand_name: "",
  tz: "",
  contact_phone: "",
  contact_email: "",
  street: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  latitude: "",
  longitude: "",
  geofence_meters: "",
  pos_external_id: "",
  is_active: true,
  open_hours: defaultHours(),
  printer_config_raw: "{\n  \n}",
};

export default function LocationsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = !!me?.is_global_admin;
  const toast = useToast();
  const { activeId, setActiveId } = useActiveLocation();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: Locations.list,
  });

  // Build filter options
  const brandOptions = React.useMemo(() => {
    const set = new Set<string>();
    (rows || []).forEach((l: any) => l.brand_name && set.add(l.brand_name));
    return Array.from(set).map((b) => ({ value: b, label: b }));
  }, [rows]);
  const tzOptions = React.useMemo(() => {
    const set = new Set<string>();
    (rows || []).forEach((l: any) => l.tz && set.add(l.tz));
    return Array.from(set).map((t) => ({ value: t, label: t }));
  }, [rows]);
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Filters + sort
  const [q, setQ] = React.useState("");
  const [brandFilter, setBrandFilter] = React.useState<string[]>([]);
  const [tzFilter, setTzFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<SortBy>("created_at");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  // Modal + form
  const [modal, setModal] = React.useState<ModalKind>(null);
  const [form, setForm] = React.useState({ ...blankForm });
  const [editing, setEditing] = React.useState<Location | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const canEdit = (loc: Location) => isAdmin || loc.my_role === "MANAGER";

  function fillFromLocation(l: Location) {
    const addr = (l.address_json || {}) as any;
    setForm({
      name: l.name || "",
      brand_name: l.brand_name || "",
      tz: l.tz || "",
      contact_phone: (l.contact_phone as any) || "",
      contact_email: (l.contact_email as any) || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      postal_code: addr.postal_code || "",
      country: addr.country || "",
      latitude: l.latitude != null ? String(l.latitude) : "",
      longitude: l.longitude != null ? String(l.longitude) : "",
      geofence_meters:
        l.geofence_meters != null ? String(l.geofence_meters) : "",
      pos_external_id: (l.pos_external_id as any) || "",
      is_active: Boolean(l.is_active ?? true),
      open_hours: normalizeHours(l.open_hours_json),
      printer_config_raw: prettyJson(l.printer_config_json),
    });
  }

  // Validation
  type Errors = Partial<Record<keyof typeof blankForm | "hours", string>>;
  function validate(f: typeof form): Errors {
    const e: Errors = {};
    if (!String(f.name).trim()) e.name = "Name is required";
    if (!String(f.tz).trim()) e.tz = "Time zone is required";
    if (f.contact_email && !/^\S+@\S+\.\S+$/.test(f.contact_email))
      e.contact_email = "Invalid email";
    if (f.latitude !== "" && isNaN(Number(f.latitude)))
      e.latitude = "Latitude must be a number";
    if (f.longitude !== "" && isNaN(Number(f.longitude)))
      e.longitude = "Longitude must be a number";
    if (
      f.geofence_meters !== "" &&
      (isNaN(Number(f.geofence_meters)) || Number(f.geofence_meters) < 0)
    )
      e.geofence_meters = "Geofence must be a non-negative number";

    // hours: if not closed, every interval must have both open & close
    let bad = false;
    (Object.keys(f.open_hours) as DayKey[]).forEach((k) => {
      const d = f.open_hours[k];
      if (!d.closed) {
        if (!d.intervals.length) bad = true;
        d.intervals.forEach((x) => {
          if (!x.open || !x.close) bad = true;
        });
      }
    });
    if (bad)
      e.hours = "Please complete all open/close times or mark day as Closed.";
    return e;
  }
  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  // Mutations
  const qcInvalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["locations"] });
  };
  const createMut = useMutation({
    mutationFn: () => Locations.create(toPayload(form) as any),
    onSuccess: async () => {
      setModal(null);
      setForm({ ...blankForm });
      setSubmitted(false);
      await qcInvalidate();
      toast.show("Location created");
    },
  });
  const updateMut = useMutation({
    mutationFn: () => Locations.update(editing!.id, toPayload(form) as any),
    onSuccess: async () => {
      setModal(null);
      setEditing(null);
      setSubmitted(false);
      setConfirmDelete(false);
      await qcInvalidate();
      toast.show("Location updated");
    },
  });
  const deleteMut = useMutation({
    mutationFn: () => Locations.delete(editing!.id),
    onSuccess: async () => {
      setModal(null);
      setEditing(null);
      setSubmitted(false);
      setConfirmDelete(false);
      await qcInvalidate();
      toast.show("Location deleted");
    },
  });

  // Data pipeline (filters then sort)
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = rows as Location[];
    if (term) {
      arr = arr.filter(
        (l) =>
          (l.name || "").toLowerCase().includes(term) ||
          (l.brand_name || "").toLowerCase().includes(term) ||
          (l.tz || "").toLowerCase().includes(term) ||
          (l.contact_email || "").toLowerCase().includes(term)
      );
    }
    if (brandFilter.length)
      arr = arr.filter((l) =>
        l.brand_name ? brandFilter.includes(l.brand_name) : false
      );
    if (tzFilter.length)
      arr = arr.filter((l) => (l.tz ? tzFilter.includes(l.tz) : false));
    if (statusFilter.length) {
      arr = arr.filter((l) => {
        const s = l.is_active ? "active" : "inactive";
        return statusFilter.includes(s);
      });
    }
    return arr;
  }, [rows, q, brandFilter, tzFilter, statusFilter]);

  const data = React.useMemo(() => {
    const arr = [...filtered];
    const cmp = (a: string, b: string) => a.localeCompare(b);
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return dir * cmp(a.name || "", b.name || "");
      if (sortBy === "brand")
        return dir * cmp(a.brand_name || "", b.brand_name || "");
      if (sortBy === "tz") return dir * cmp(a.tz || "", b.tz || "");
      if (sortBy === "status") {
        const av = a.is_active ? 1 : 0;
        const bv = b.is_active ? 1 : 0;
        return dir * (av - bv);
      }
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return dir * (at - bt);
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  // Actions
  function tryCreate() {
    setSubmitted(true);
    if (!hasErrors && isPrinterJsonValid(form.printer_config_raw)) {
      createMut.mutate();
    }
  }
  function trySave() {
    setSubmitted(true);
    if (!hasErrors && isPrinterJsonValid(form.printer_config_raw) && editing) {
      updateMut.mutate();
    }
  }

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto px-3 sm:px-4">
      {toast.node}

      {/* Title + action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Locations</h1>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setForm({ ...blankForm });
              setSubmitted(false);
              setModal("create");
            }}
          >
            + New Location
          </button>
        )}
      </div>

      {/* Filters toolbar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              className="input pl-10 w-[260px]"
              placeholder="Search name, brand, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
          </div>

          <FilterDropdownMulti
            label="Brand"
            icon={<span>🏷️</span>}
            options={brandOptions}
            value={brandFilter}
            onChange={setBrandFilter}
            placeholder="All brands"
          />
          <FilterDropdownMulti
            label="Time zones"
            icon={<span>🕒</span>}
            options={tzOptions}
            value={tzFilter}
            onChange={setTzFilter}
            placeholder="All time zones"
          />
          <FilterDropdownMulti
            label="Status"
            icon={<span>✅</span>}
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Any status"
            selectedText={(vals, opts) =>
              vals.length === 1
                ? (opts.find((o) => o.value === vals[0])?.label ?? null)
                : null
            }
          />

          <div className="ml-auto">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setQ("");
                setBrandFilter([]);
                setTzFilter([]);
                setStatusFilter([]);
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

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {isLoading ? (
          <div className="card p-4">Loading…</div>
        ) : data.length === 0 ? (
          <div className="card p-6 text-center text-gray-500">
            No locations yet.
          </div>
        ) : (
          data.map((l) => {
            const isActive = activeId === l.id;
            return (
              <div
                key={l.id}
                className={`card p-4 hover:bg-brand-50/60 transition-colors ${
                  isActive ? "ring-1 ring-brand-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {l.name}
                      {isActive && <ActiveChip />}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {l.my_role === "MANAGER"
                        ? "You manage this location"
                        : l.brand_name || "—"}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      l.is_active
                        ? "border-brand-600 text-brand-600"
                        : "border-gray-400 text-gray-600"
                    }`}
                  >
                    {l.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-700">{l.tz}</div>
                <div className="mt-1 text-xs text-gray-600">
                  {l.contact_phone || "—"} • {l.contact_email || "—"}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="btn"
                    onClick={() => {
                      setEditing(l);
                      setConfirmDelete(false);
                      setSubmitted(false);
                      fillFromLocation(l);
                      setModal("edit");
                    }}
                    disabled={!canEdit(l)}
                  >
                    Edit
                  </button>

                  {isActive ? (
                    <ActiveChip />
                  ) : (
                    <SetActiveButton
                      onClick={() => {
                        setActiveId(l.id);
                        toast.show(`“${l.name}” set as active`);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden hidden md:block">
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
                  label="Brand"
                  active={sortBy === "brand"}
                  dir={sortDir}
                  onClick={() => {
                    setSortBy("brand");
                    setSortDir((d) =>
                      sortBy === "brand"
                        ? d === "asc"
                          ? "desc"
                          : "asc"
                        : "asc"
                    );
                  }}
                />
                <ThSortable
                  label="Time zone"
                  active={sortBy === "tz"}
                  dir={sortDir}
                  onClick={() => {
                    setSortBy("tz");
                    setSortDir((d) =>
                      sortBy === "tz" ? (d === "asc" ? "desc" : "asc") : "asc"
                    );
                  }}
                />
                <ThSortable
                  label="Status"
                  active={sortBy === "status"}
                  dir={sortDir}
                  onClick={() => {
                    setSortBy("status");
                    setSortDir((d) =>
                      sortBy === "status"
                        ? d === "asc"
                          ? "desc"
                          : "asc"
                        : "asc"
                    );
                  }}
                />
                <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Contact
                </th>
                <th className="border-b px-3 py-2 text-right text-sm font-medium text-gray-700 w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows rows={8} />
              ) : data.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center py-10 text-gray-500">
                    No locations yet.
                  </Td>
                </tr>
              ) : (
                data.map((l, i) => {
                  const isActive = activeId === l.id;
                  return (
                    <tr
                      key={l.id}
                      className={`transition-colors ${
                        i % 2 ? "bg-gray-50/60" : "bg-white"
                      } hover:bg-brand-50/60 ${
                        isActive ? "ring-1 ring-brand-200" : ""
                      }`}
                    >
                      <Td>
                        <div className="font-medium flex items-center gap-2">
                          {l.name}
                          {isActive && <ActiveChip />}
                        </div>
                        <div className="text-xs text-gray-500">
                          {l.my_role === "MANAGER"
                            ? "You manage this location"
                            : l.my_role
                              ? `My role: ${l.my_role}`
                              : ""}
                        </div>
                      </Td>
                      <Td>{l.brand_name || "—"}</Td>
                      <Td>{l.tz}</Td>
                      <Td>
                        <span
                          className={`badge ${
                            l.is_active
                              ? "border-brand-600 text-brand-600"
                              : "border-gray-400 text-gray-600"
                          }`}
                        >
                          {l.is_active ? "Active" : "Inactive"}
                        </span>
                      </Td>
                      <Td>
                        <div className="text-sm">{l.contact_phone || "—"}</div>
                        <div className="text-xs text-gray-600">
                          {l.contact_email || "—"}
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="inline-flex gap-2 items-center">
                          <button
                            className="btn"
                            onClick={() => {
                              setEditing(l);
                              setConfirmDelete(false);
                              setSubmitted(false);
                              fillFromLocation(l);
                              setModal("edit");
                            }}
                            disabled={!canEdit(l)}
                          >
                            Edit
                          </button>
                          {isActive ? (
                            <ActiveChip />
                          ) : (
                            <SetActiveButton
                              onClick={() => {
                                setActiveId(l.id);
                                toast.show(`“${l.name}” set as active`);
                              }}
                            />
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE */}
      <Modal
        open={modal === "create"}
        onClose={() => {
          setModal(null);
          setSubmitted(false);
        }}
        title="Create location"
        size="lg"
        footer={
          <div className="flex items-center gap-2">
            <button className="btn" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={tryCreate}
              disabled={createMut.isPending}
            >
              {createMut.isPending && <Spinner />}
              Create
            </button>
          </div>
        }
      >
        <Form
          form={form}
          setForm={setForm}
          submitted={submitted}
          errors={errors}
        />
        {submitted && !isPrinterJsonValid(form.printer_config_raw) && (
          <div className="text-red-600 text-sm mt-2">
            Printer config JSON is invalid.
          </div>
        )}
        {createMut.isError && (
          <div className="text-red-600 text-sm mt-2">
            {(createMut.error as any)?.message || "Failed to create"}
          </div>
        )}
      </Modal>

      {/* EDIT + Delete inside */}
      <Modal
        open={modal === "edit"}
        onClose={() => {
          setModal(null);
          setEditing(null);
          setSubmitted(false);
          setConfirmDelete(false);
        }}
        title={editing ? `Edit: ${editing.name}` : "Edit location"}
        size="lg"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
            {isAdmin && editing && (
              <div className="flex items-center gap-2">
                {!confirmDelete ? (
                  <button
                    className="btn"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete…
                  </button>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">
                      Confirm delete?
                    </span>
                    <button
                      className="btn"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleteMut.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary inline-flex items-center gap-2"
                      onClick={() => deleteMut.mutate()}
                      disabled={deleteMut.isPending}
                    >
                      {deleteMut.isPending && <Spinner />}
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="sm:ml-auto flex items-center gap-2">
              <button
                className="btn"
                onClick={() => {
                  setModal(null);
                  setEditing(null);
                  setSubmitted(false);
                  setConfirmDelete(false);
                }}
              >
                Close
              </button>
              <button
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={trySave}
                disabled={updateMut.isPending}
              >
                {updateMut.isPending && <Spinner />}
                Save
              </button>
            </div>
          </div>
        }
      >
        <Form
          form={form}
          setForm={setForm}
          submitted={submitted}
          errors={errors}
        />
        {submitted && !isPrinterJsonValid(form.printer_config_raw) && (
          <div className="text-red-600 text-sm mt-2">
            Printer config JSON is invalid.
          </div>
        )}
        {updateMut.isError && (
          <div className="text-red-600 text-sm mt-2">
            {(updateMut.error as any)?.message || "Failed to update"}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ───────────────────────────── Form ─── */
function Form({
  form,
  setForm,
  submitted,
  errors,
}: {
  form: any;
  setForm: (f: any) => void;
  submitted: boolean;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <div className="grid gap-4 max-h-[70vh] overflow-auto pr-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <input
            className={`input w-full ${submitted && errors.name ? "border-red-400" : ""}`}
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {submitted && errors.name && (
            <div className="text-xs text-red-600 mt-1">{errors.name}</div>
          )}
        </div>
        <input
          className="input w-full"
          placeholder="Brand (optional)"
          value={form.brand_name}
          onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
        />
      </div>

      <div>
        <input
          className={`input w-full ${submitted && errors.tz ? "border-red-400" : ""}`}
          placeholder="Time zone (e.g. America/Chicago) *"
          value={form.tz}
          onChange={(e) => setForm({ ...form, tz: e.target.value })}
        />
        {submitted && errors.tz && (
          <div className="text-xs text-red-600 mt-1">{errors.tz}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="input w-full"
          placeholder="Contact phone"
          value={form.contact_phone}
          onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
        />
        <div>
          <input
            className={`input w-full ${submitted && errors.contact_email ? "border-red-400" : ""}`}
            placeholder="Contact email"
            value={form.contact_email}
            onChange={(e) =>
              setForm({ ...form, contact_email: e.target.value })
            }
          />
          {submitted && errors.contact_email && (
            <div className="text-xs text-red-600 mt-1">
              {errors.contact_email}
            </div>
          )}
        </div>
      </div>

      <div className="rounded border">
        <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
          Address
        </div>
        <div className="p-3 grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input w-full"
              placeholder="Street"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
            />
            <input
              className="input w-full"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input w-full"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <input
              className="input w-full"
              placeholder="Postal code"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
            />
            <input
              className="input w-full"
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <input
            className={`input w-full ${submitted && errors.latitude ? "border-red-400" : ""}`}
            placeholder="Latitude"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          />
          {submitted && errors.latitude && (
            <div className="text-xs text-red-600 mt-1">{errors.latitude}</div>
          )}
        </div>
        <div>
          <input
            className={`input w-full ${submitted && errors.longitude ? "border-red-400" : ""}`}
            placeholder="Longitude"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          />
          {submitted && errors.longitude && (
            <div className="text-xs text-red-600 mt-1">{errors.longitude}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <input
            className={`input w-full ${submitted && errors.geofence_meters ? "border-red-400" : ""}`}
            placeholder="Geofence meters (optional)"
            value={form.geofence_meters}
            onChange={(e) =>
              setForm({ ...form, geofence_meters: e.target.value })
            }
          />
          {submitted && errors.geofence_meters && (
            <div className="text-xs text-red-600 mt-1">
              {errors.geofence_meters}
            </div>
          )}
        </div>
        <input
          className="input w-full"
          placeholder="POS external ID (optional)"
          value={form.pos_external_id}
          onChange={(e) =>
            setForm({ ...form, pos_external_id: e.target.value })
          }
        />
      </div>

      <HoursEditor
        value={form.open_hours}
        onChange={(v) => setForm({ ...form, open_hours: v })}
        submitted={submitted}
        error={errors.hours || null}
      />

      <div className="rounded border">
        <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">
          Printer config (JSON)
        </div>
        <div className="p-3">
          <textarea
            className="input font-mono text-xs h-36 w-full"
            value={form.printer_config_raw}
            onChange={(e) =>
              setForm({ ...form, printer_config_raw: e.target.value })
            }
            placeholder='e.g. { "model": "Epson TM-T88", "dpi": 203 }'
          />
          <div className="text-xs text-gray-500 mt-1">
            We’ll validate JSON on save.
          </div>
        </div>
      </div>

      <label className="text-sm flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Active
      </label>
    </div>
  );
}

/* ───────────────────────── helpers ─── */
function prettyJson(v: any) {
  try {
    return v ? JSON.stringify(v, null, 2) : "{\n  \n}";
  } catch {
    return "{\n  \n}";
  }
}
function toPayload(form: any) {
  const addr: any = {};
  if (form.street) addr.street = form.street;
  if (form.city) addr.city = form.city;
  if (form.state) addr.state = form.state;
  if (form.postal_code) addr.postal_code = form.postal_code;
  if (form.country) addr.country = form.country;

  let printerConfig: any | undefined = undefined;
  try {
    const t = (form.printer_config_raw || "").trim();
    if (t) printerConfig = JSON.parse(t);
  } catch {}

  const payload: Partial<Location> & { name: string; tz: string } = {
    name: String(form.name || "").trim(),
    brand_name: form.brand_name || undefined,
    tz: String(form.tz || "").trim(),
    address_json: Object.keys(addr).length ? addr : undefined,
    latitude: form.latitude !== "" ? Number(form.latitude) : undefined,
    longitude: form.longitude !== "" ? Number(form.longitude) : undefined,
    contact_phone: form.contact_phone || undefined,
    contact_email: form.contact_email || undefined,
    open_hours_json: hoursToJson(form.open_hours),
    geofence_meters:
      form.geofence_meters !== "" ? Number(form.geofence_meters) : undefined,
    printer_config_json: printerConfig,
    pos_external_id: form.pos_external_id || undefined,
    is_active: !!form.is_active,
  };
  return payload;
}
function isPrinterJsonValid(txt: string) {
  try {
    const t = (txt || "").trim();
    if (!t) return true;
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

/* --- Active/Set Active UI helpers --- */
function ActiveChip() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-brand-600 bg-brand-50 text-brand-700">
      Active
    </span>
  );
}
function SetActiveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="btn inline-flex items-center gap-1 border border-brand-200 hover:border-brand-400 hover:bg-brand-50"
      onClick={onClick}
      title="Set as active location"
    >
      <span>Set Active</span>
    </button>
  );
}
