// apps/web/src/pages/Profile.tsx
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Me, UsersAPI, type RoleKey, type EmploymentRecord } from "../lib/api";

/* ───────────────────────── Toast (same as Locations) ─── */ // NEW
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

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
  );
}

function Section({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className="card overflow-hidden">
      <div className="h-1 bg-brand-600" />
      <div className="p-5">
        <h2 className="text-base font-semibold mb-3">{title}</h2>
        <div className="grid gap-4">{children}</div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const toast = useToast(); // NEW

  // 1) Who am I?
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: Me.get });

  // 2) Full personal profile + assignments
  const { data: detail } = useQuery({
    queryKey: ["me:detail", me?.user_id],
    queryFn: () => UsersAPI.get(me!.user_id),
    enabled: !!me?.user_id,
  });

  // 3) Employment (per location) to show professional info
  const { data: employment = [] } = useQuery({
    queryKey: ["me:employment", me?.user_id],
    queryFn: () => UsersAPI.getEmployment(me!.user_id),
    enabled: !!me?.user_id,
  });

  // ───────────────────────────── Local form state (personal)
  const [personal, setPersonal] = React.useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: { street: "", city: "", state: "", postal_code: "", country: "" },
    emergency: { name: "", relation: "", phone: "", notes: "" },
  });

  React.useEffect(() => {
    if (!detail) return;
    const addr = (detail as any).address_json ?? {};
    const emg = (detail as any).emergency_contact_json ?? {};
    setPersonal({
      first_name: (detail as any).first_name ?? "",
      last_name: (detail as any).last_name ?? "",
      phone: (detail as any).phone ?? "",
      date_of_birth: (detail as any).date_of_birth ?? "",
      gender: (detail as any).gender ?? "",
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
  }, [detail]);

  // Save personal details
  const savePersonal = useMutation({
    mutationFn: () =>
      UsersAPI.update(me!.user_id, {
        first_name: personal.first_name || undefined,
        last_name: personal.last_name || undefined,
        phone: personal.phone || undefined,
        date_of_birth: personal.date_of_birth || undefined,
        gender: personal.gender || undefined,
        address_json: Object.values(personal.address).some((v) =>
          String(v).trim()
        )
          ? personal.address
          : undefined,
        emergency_contact_json: Object.values(personal.emergency).some((v) =>
          String(v).trim()
        )
          ? personal.emergency
          : undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me:detail"] });
      toast.show("Personal info updated"); // NEW
    },
    onError: (err: any) => {
      toast.show(`⚠️ ${err?.message || "Failed to update personal info"}`); // NEW
    },
  });

  // (If/when you re‑enable schedule preferences, you can wire their mutation
  // toasts exactly like savePersonal above.)

  // ───────────────────────────── UI
  return (
    <div className="space-y-6">
      {toast.node /* NEW: mounts the toast bubble */}

      <div>
        <h1 className="text-xl font-semibold">My Profile</h1>
        <p className="text-sm text-gray-600">
          Manage your personal info. Professional details are read‑only.
        </p>
      </div>

      {/* Personal (editable) */}
      <Section title="Personal information">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="First name"
            value={personal.first_name}
            onChange={(e) =>
              setPersonal({ ...personal, first_name: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Last name"
            value={personal.last_name}
            onChange={(e) =>
              setPersonal({ ...personal, last_name: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Phone"
            value={personal.phone}
            onChange={(e) =>
              setPersonal({ ...personal, phone: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Date of birth (YYYY‑MM‑DD)"
              value={personal.date_of_birth}
              onChange={(e) =>
                setPersonal({ ...personal, date_of_birth: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Gender (optional)"
              value={personal.gender}
              onChange={(e) =>
                setPersonal({ ...personal, gender: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="text-xs text-gray-600 font-medium">
            Address (optional)
          </div>
          <input
            className="input"
            placeholder="Street"
            value={personal.address.street}
            onChange={(e) =>
              setPersonal({
                ...personal,
                address: { ...personal.address, street: e.target.value },
              })
            }
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="City"
              value={personal.address.city}
              onChange={(e) =>
                setPersonal({
                  ...personal,
                  address: { ...personal.address, city: e.target.value },
                })
              }
            />
            <input
              className="input"
              placeholder="State"
              value={personal.address.state}
              onChange={(e) =>
                setPersonal({
                  ...personal,
                  address: { ...personal.address, state: e.target.value },
                })
              }
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="input"
              placeholder="Postal code"
              value={personal.address.postal_code}
              onChange={(e) =>
                setPersonal({
                  ...personal,
                  address: { ...personal.address, postal_code: e.target.value },
                })
              }
            />
            <input
              className="input"
              placeholder="Country"
              value={personal.address.country}
              onChange={(e) =>
                setPersonal({
                  ...personal,
                  address: { ...personal.address, country: e.target.value },
                })
              }
            />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="text-xs text-gray-600 font-medium">
            Emergency contact (optional)
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Name"
              value={personal.emergency.name}
              onChange={(e) =>
                setPersonal({
                  ...personal,
                  emergency: { ...personal.emergency, name: e.target.value },
                })
              }
            />
            <input
              className="input"
              placeholder="Relationship"
              value={personal.emergency.relation}
              onChange={(e) =>
                setPersonal({
                  ...personal,
                  emergency: {
                    ...personal.emergency,
                    relation: e.target.value,
                  },
                })
              }
            />
          </div>
          <input
            className="input"
            placeholder="Phone"
            value={personal.emergency.phone}
            onChange={(e) =>
              setPersonal({
                ...personal,
                emergency: { ...personal.emergency, phone: e.target.value },
              })
            }
          />
          <textarea
            className="input h-20"
            placeholder="Notes"
            value={personal.emergency.notes}
            onChange={(e) =>
              setPersonal({
                ...personal,
                emergency: { ...personal.emergency, notes: e.target.value },
              })
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            className="btn btn-primary inline-flex items-center gap-2"
            onClick={() => savePersonal.mutate()}
            disabled={savePersonal.isPending || !me?.user_id}
          >
            {savePersonal.isPending && <Spinner />}
            Save personal info
          </button>
        </div>
      </Section>

      {/* Professional (read‑only; trimmed to Role/Employment type/Position) */}
      <Section title="Professional details">
        <div className="grid gap-4">
          {(detail?.assignments || []).length === 0 ? (
            <div className="text-sm text-gray-600">
              You don’t have any location assignments yet.
            </div>
          ) : (
            detail!.assignments.map(
              (a: {
                location_id: string;
                location_name: string;
                role_key: RoleKey;
              }) => {
                const row = (employment as EmploymentRecord[]).find(
                  (e) => e.location_id === a.location_id
                );
                return (
                  <div
                    key={a.location_id}
                    className="rounded border p-4 bg-white"
                  >
                    <div className="font-semibold">{a.location_name}</div>
                    <div className="mt-2 grid gap-1 text-gray-700">
                      <div>
                        Role: <span className="font-medium">{a.role_key}</span>
                      </div>
                      <div>
                        Employment type:{" "}
                        <span className="font-medium">
                          {row?.employment_type || "—"}
                        </span>
                      </div>
                      <div>
                        Position:{" "}
                        <span className="font-medium">
                          {row?.position_title || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </Section>
    </div>
  );
}
