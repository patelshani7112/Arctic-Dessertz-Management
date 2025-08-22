import * as React from "react";
import { NavLink as RR, useLocation } from "react-router-dom";

/** Active link shows brand color; sidebar stays open (no onClick close) */
export function NavLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon?: React.ReactNode;
  label: string;
}) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <RR
      to={to}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
        ${
          active ? "bg-brand-600 text-white" : "hover:bg-gray-100 text-gray-800"
        }`}
    >
      {icon}
      {label}
    </RR>
  );
}
