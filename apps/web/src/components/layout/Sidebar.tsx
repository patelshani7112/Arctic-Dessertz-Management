import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Me } from "../../lib/api";
import { useActiveLocation } from "../../lib/activeLocation";
import { NavLink } from "./parts";
import { IconHome, IconUsers, IconMap, IconClose } from "../icons/Icons";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const { myLocations = [], activeId } = useActiveLocation();

  const isAdmin = !!me?.is_global_admin;
  const myRoleAtActive =
    myLocations.find((l) => l.id === activeId)?.my_role || null;
  const isManagerAtActive = myRoleAtActive === "MANAGER";

  // Both routes depend on active location (or admin)
  const canSeeUsers = isAdmin || isManagerAtActive;
  const canSeeLocations = isAdmin || isManagerAtActive;

  // Close on Esc
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* overlay for mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 md:hidden transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      {/* drawer */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-72 bg-white border-r z-40
                    transition-transform duration-200 ease-out
                    ${open ? "translate-x-0" : "-translate-x-80"}`}
        role="complementary"
        aria-label="Sidebar navigation"
      >
        <div className="md:hidden flex justify-end p-2">
          <button className="btn" onClick={onClose}>
            <IconClose /> Close
          </button>
        </div>

        <nav className="p-3 space-y-1">
          <NavLink to="/app" icon={<IconHome />} label="Dashboard" />
          {canSeeUsers && (
            <NavLink to="/app/users" icon={<IconUsers />} label="Users" />
          )}
          {canSeeLocations && (
            <NavLink to="/app/locations" icon={<IconMap />} label="Locations" />
          )}
        </nav>
      </aside>
    </>
  );
}
