// apps/web/src/components/layout/Header.tsx
import * as React from "react";
import { useActiveLocation } from "../../lib/activeLocation";
import { Select } from "../ui/Select";
import { IconMenu } from "../icons/Icons";
import { AvatarMenu } from "./AvatarMenu";
import { useMe } from "../../lib/useMe";

const COMPANY = import.meta.env.VITE_COMPANY_NAME || "Arctic Dessert";

type HeaderProps = { onToggleSidebar: () => void };

export function Header({ onToggleSidebar }: HeaderProps) {
  const { data: me } = useMe();
  const isAdmin = !!me?.is_global_admin;

  const { activeId, setActiveId, myLocations } = useActiveLocation();

  const options = React.useMemo(() => {
    const base = myLocations.map((l) => ({
      value: l.id,
      label: `${l.name}${l.my_role ? ` (${l.my_role})` : ""}`,
    }));
    return isAdmin
      ? [{ value: "", label: "All locations" }, ...base]
      : base.length
        ? base
        : [{ value: "", label: "No locations" }];
  }, [isAdmin, myLocations]);

  return (
    <header className="h-14 bg-white border-b sticky top-0 z-30">
      <div className="h-full px-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle sidebar"
            className="btn btn-ghost"
            onClick={onToggleSidebar}
          >
            <IconMenu />
          </button>
          <div className="font-semibold tracking-wide">{COMPANY}</div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={activeId ?? ""} // "" means "All locations"
            onChange={(v) => setActiveId(v || null)}
            options={options}
          />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
